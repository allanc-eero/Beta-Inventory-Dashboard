# Databricks Tester Refresh — Runbook

How the dashboard pulls **current tester info** (name / email / network / location)
for the devices on the platform, from Databricks, on demand.

## What it does (and doesn't)

- **Does:** For the serials already on the Fetch platform, looks up the matching
  tester row in **one** Databricks table and refreshes those device records.
- **Direction:** Fetch device list → Databricks lookup → update only those records.
  It asks Databricks *only* about serials already on the platform. Devices not on
  Fetch are never queried, returned, or touched.
- **Read-only:** The API route can only run `SELECT` / `SHOW` / `DESCRIBE`. There is
  **no** general SQL runner. Serials are bound as query parameters (no injection).
- **Does NOT** write anything to Databricks. Updates land in the local app store
  (localStorage today), and every field change is logged to the device audit trail.

## Security posture

- Use a **service-principal token** with **`SELECT`-only** grant on just the tester
  table — not a personal full-access PAT. A leak then exposes read access to one
  table, not your account.
- For a first test, a **short-expiry (1-day) read-only personal token** is acceptable
  because it self-destructs.
- The token lives in `.env.local`, which is **gitignored and untracked** — it never
  reaches GitHub. (Verified.)
- Durable upgrade path: pull the token from AWS Secrets Manager (the project already
  has the AWS SDK) instead of a flat file.

## Online status (Network Status Sync)

The dashboard's **Network Status Sync** button now uses REAL device liveness from
Databricks (`core.node_sessions`), replacing the previous random simulation.

- Endpoint: `POST /api/databricks { "op": "status", "serials": [...] }`
- Per serial it returns `online` (bool), `state` (`online` / `offline` /
  `never_online`), `rawStatus`, `lastAlive`, and `updated` (last ingest time).
- A serial with no session row = **never online**.

Caveat: `node_sessions` reflects Databricks' last ingest, which can lag real time
by minutes-to-hours depending on the pipeline. So it's "recently online," not
live-to-the-second.

Cold-start note: the SQL warehouse auto-stops when idle and takes ~1-2 min to spin
back up. The first query after idle is slow; the route polls up to ~2 min for it to
finish, so a status check right after a quiet period may take a minute. Subsequent
checks are fast while the warehouse stays warm.

## How the lookup resolves serial → tester

The tester for a device is the **owner of the network** the eero is on. The route
runs ONE fixed, parameterized, read-only join (verified against real devices):

```
core.node_sessions   (serial_number → network_id, where revoked IS NULL)
  → core.network_admins (network_id, role='network-owner', not deleted → user_id)
    → core.users        (id → name, email, city)
```

It returns one row per serial (most recent session wins via QUALIFY ROW_NUMBER).
Fields mapped to the platform:

| Databricks | Platform field |
|---|---|
| `users.name` | `assignedTo` |
| `users.email` | `assignedEmail` |
| `node_sessions.network_id` | `network` |
| `users.city` | `location` |

This required NO permission changes and NO new Databricks objects — the read-only
token already reads these `core` tables. Table names are env-overridable
(`DATABRICKS_NODES_TABLE`, `DATABRICKS_ADMINS_TABLE`, `DATABRICKS_USERS_TABLE`) but
the join structure is fixed in code, so the client can never run arbitrary SQL.

### Optional: pre-joined view (cleaner, single-table mode)
If your team later creates a view (e.g. `core.beta_device_testers`) exposing
`serial_number, tester_name, tester_email, network, location`, set
`DATABRICKS_TESTER_TABLE` to it and the route switches to single-table mode
automatically. Not required — the join works as-is.

## One-time setup

### 1. Get the three connection values

| Value | Where to find it |
|---|---|
| `DATABRICKS_HOST` | Browser address bar in Databricks, e.g. `https://<id>.cloud.databricks.com` (no trailing slash). |
| `DATABRICKS_WAREHOUSE_ID` | Left sidebar → **SQL Warehouses** → pick a running one → **Connection details** → "HTTP path" `/sql/1.0/warehouses/<ID>` → copy `<ID>`. |
| `DATABRICKS_TOKEN` | Avatar → **Settings → Developer → Access tokens → Generate** (test), or a **service principal** token (durable, admin-provisioned). |

### 2. Paste into `.env.local`

```
DATABRICKS_HOST=https://<your-workspace>.cloud.databricks.com
DATABRICKS_TOKEN=dapi********************************
DATABRICKS_WAREHOUSE_ID=<warehouse id>
# DATABRICKS_TESTER_TABLE / DATABRICKS_TESTER_COLUMNS — leave blank to use the
# built-in network-owner join (default). Only set these if you create a view.
```

Restart `npm run dev` after editing env.

### 3. Verify the connection

In the dashboard, the **Tester Info Refresh** card (below Network Status Sync) →
click **↻ Re-check**. Green "Connected" = token valid + ready. It shows your identity.

Or from a terminal:
```
curl -s localhost:3000/api/databricks | jq
```

That's it — the lookup works immediately via the built-in join. The discovery
endpoints below are only needed if the schema changes and you need to re-map.

### 4. (Only if needed) Read-only schema discovery

If table names ever change, find the new ones with read-only metadata queries:

```
curl -s "localhost:3000/api/databricks?discover=catalogs" | jq '.rows'
curl -s "localhost:3000/api/databricks?discover=schemas&in=<catalog>" | jq '.rows'
curl -s "localhost:3000/api/databricks?discover=tables&in=<catalog>.<schema>" | jq '.rows'
curl -s "localhost:3000/api/databricks?discover=columns&in=<catalog>.<schema>.<table>" | jq '.rows'
```

Then override `DATABRICKS_NODES_TABLE` / `DATABRICKS_ADMINS_TABLE` /
`DATABRICKS_USERS_TABLE` in `.env.local` if the join tables moved.

### 5. (Optional) Configure a pre-joined view

Set the table:
```
DATABRICKS_TESTER_TABLE=<catalog>.<schema>.<table>

```

If the column names differ from the defaults
(`serial_number`, `tester_name`, `tester_email`, `network_link`, `location`),
remap them with JSON:
```
DATABRICKS_TESTER_COLUMNS={"serial":"device_sn","name":"full_name","email":"email","network":"network_url","location":"city"}
```

Restart dev, **↻ Re-check**, then click **Refresh Tester Info (N)**.

## Daily use

- Click **Refresh Tester Info (N)** on the dashboard.
- It sends the platform's serials, gets back matched tester rows, and updates
  `assignedTo` / `assignedEmail` / `network` / `location` where they changed.
- The result line shows: matched count, updated count, and any serials with **no
  tester match** (these exist on Fetch but not in the Databricks table).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Not configured" | Missing HOST / TOKEN / WAREHOUSE_ID in `.env.local`. |
| "Setup needed", connected as <you> | Token valid but `DATABRICKS_TESTER_TABLE` not set — do discovery (step 4). |
| `Databricks 401` | Token expired/invalid. Regenerate (test token) or re-issue the service-principal token. |
| `Databricks 403` on a table | The token's grants don't include `SELECT` on that table. Ask an admin to grant it. |
| Many serials in "no tester match" | Those serials aren't in the configured table, or the serial column is mapped wrong. Re-check column mapping. |
| Refresh button disabled | Hover it — the tooltip says exactly which prerequisite is missing. |

## Files

- `src/app/api/databricks/route.ts` — locked-down read-only route (lookup + discovery + health).
- `src/components/TesterRefreshButton.tsx` — the dashboard card.
- `.env.local` — credentials (gitignored).
