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
DATABRICKS_TESTER_TABLE=          # set after discovery (step 4)
DATABRICKS_TESTER_COLUMNS=        # optional column remap (step 4)
```

Restart `npm run dev` after editing env.

### 3. Verify the connection

In the dashboard, the **Tester Info Refresh** card (below Network Status Sync) →
click **↻ Re-check**. Green "Connected" = token valid. It also shows your identity.

Or from a terminal:
```
curl -s localhost:3000/api/databricks | jq
```

### 4. Discover the tester table (read-only)

You don't need to know the table name up front — find it with read-only metadata
queries (all safe; they only list structure):

```
# list catalogs
curl -s "localhost:3000/api/databricks?discover=catalogs" | jq '.rows'

# list schemas in a catalog
curl -s "localhost:3000/api/databricks?discover=schemas&in=<catalog>" | jq '.rows'

# list tables in a schema
curl -s "localhost:3000/api/databricks?discover=tables&in=<catalog>.<schema>" | jq '.rows'

# inspect a table's columns
curl -s "localhost:3000/api/databricks?discover=columns&in=<catalog>.<schema>.<table>" | jq '.rows'
```

Look for the table that maps **device serial → tester**. Note its fully-qualified
name and the actual column names.

### 5. Configure table + columns

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
