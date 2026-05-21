# Learnings & Reference

## Device Status Sync — Daily Partner API Refresh

### Problem
The seed data (imported spreadsheets) contains a snapshot of device status at the time of export. Devices that were "In Transit" when the sheet was created may have since been delivered and connected to a network. The dashboard shows stale status unless we actively check.

### Solution
Poll the eero Partner API once per day to refresh device network status.

### How It Works

**API Calls (in order):**

1. `GET /2.2/organizations/self/networks/administered` — returns all networks managed by the org
2. For each network: `GET /2.2/networks/:networkId/eeros` — returns eero objects with:
   - `serial` — the 16-char device serial
   - `status` — `green` (connected), `yellow` (connecting), `red` (error)

**Logic:**
- If an eero's `status` is `green` → device is **online**
- If `yellow` → device is connecting (treat as online or in-progress depending on use case)
- If `red` → device has an error (keep as `not_online` or flag for investigation)
- If a device serial is NOT found on any network → it hasn't been set up yet, stays `not_online`

### Implementation Notes

- The sync runs via the "Sync Network Status" button on the dashboard
- In production, this should be automated as a daily cron job (or scheduled Lambda)
- Rate limit: eero API has rate limiting. Batch requests and add delays between calls
- The sync only changes `not_online` → `online`. It never downgrades `online` → `not_online` automatically (a device going offline temporarily shouldn't flip its status — that could be a reboot)
- Each status change is logged to the device timeline for audit

### When to Sync
- **Daily automated sync** — run once per day (e.g., 6 AM) to catch devices that came online overnight
- **Manual sync** — click the button when you need a real-time check (e.g., tester says "I set it up")
- **After bulk import** — run a sync 2-3 days after importing a new allocation list to see who's set up

### Edge Cases Learned

1. **Device shows "In Transit" in spreadsheet but is actually online** — This happens because the spreadsheet is a point-in-time snapshot. The device was shipped, delivered, and set up between when the sheet was created and when we imported it. The daily sync catches this.

2. **Device has a `netId` but shows `not_online`** — If the seed data includes a network ID, the device was at some point on a network. We now use this as a signal: if `netId` exists → mark as `online` during import.

3. **Notes field says "Not online" but device IS online** — The notes are human-written at a point in time. They go stale. Don't trust notes for status — trust the API.

### Production Checklist

- [ ] Store the API token securely (env variable, not in code)
- [ ] Implement retry logic for API failures (3 retries with exponential backoff)
- [ ] Respect rate limits (the API returns 400 with `error.rate.limit` if exceeded)
- [ ] Log sync results (how many checked, how many changed, any errors)
- [ ] Set up daily cron/scheduler to call the sync automatically
- [ ] Add alerting if sync fails for 2+ consecutive days
- [ ] Consider pagination — `GET /networks/administered` returns paginated results, follow `pagination.next`

---

## Shipment Tracking — Two-Leg Model

### What We Learned
Devices go through two shipping legs:
- **Leg 1:** Manufacturer/warehouse → Fulfillment Center (FC)
- **Leg 2:** FC → Tester

Each leg has its own carrier (UPS/USPS/FedEx/DHL) and tracking number.

### Status Pipeline
```
Ordered → In Transit to FC → At FC → In Transit to Tester → Delivered → Online
```

### Key Insight
The allocation list we receive (with names, tracking numbers, serials) represents **Leg 2** — devices being shipped from the FC to testers. By the time we get this list, Leg 1 is already complete.

### Data Format (from spreadsheet)
```
ShipTo | TrackingNumber | Alias | DSN 1 | DSN 2
```
- ShipTo = tester's full name
- TrackingNumber = Leg 2 tracking (carrier-specific)
- Alias = Amazon login (used to construct email: alias@amazon.com)
- DSN 1, DSN 2 = device serial numbers (some testers get multiple)

---

## Device Status Model

### `status` field = Network connectivity
- `online` — device is connected to a network (confirmed via API)
- `not_online` — device is not on any network (shipped but not set up, or disconnected)
- `in_testing` — device is in a test environment
- `in_repair` — device has a hardware issue
- `deactivated` — device has been bricked/returned via the Deactivation API

### `status` is NOT affected by:
- Checkout/checkin (that's tracked via `checkedOutTo`)
- Shipping (that's tracked via `shipmentStatus`)
- Assignment (that's tracked via `assignedTo`/`assignedEmail`)

### `shipmentStatus` field = Physical location in the pipeline
- `ordered` — device ordered, not yet shipped
- `in_transit_to_fc` — on its way to fulfillment center
- `at_fc` — sitting at the FC waiting to be forwarded
- `in_transit_to_tester` — shipped to the tester
- `delivered` — tester has received it
- `online` — tester has set it up and it's on a network

---

## Deactivation Workflow

### What "Return to eero" Does
1. Calls `POST /2.2/eeros/:id/activation_state` with `{ "active": false }` — bricks the device remotely
2. Optionally factory resets the device
3. Sets status to `deactivated` in the system
4. Creates a JIRA ticket under the assignee's name for record keeping
5. **Does NOT wipe user data** — assignee info is preserved for audit trail

### Important
- User assignment data is never deleted on deactivation (we need to know who had it last)
- A JIRA ticket is auto-created — the operator must manually close it after confirming the return
- Deactivated devices cannot come back online (the API blocks them at the network level)

---

## Overdue Device Alerts

### Trigger Conditions
A device is "overdue" when ALL of these are true:
- `dueDate` is in the past
- `checkedOutTo` has a value (someone has it)
- Device is NOT deactivated

### What Happens
- Red banner appears at top of dashboard
- "Send Reminder" creates a JIRA ticket for the overdue return
- Reminders are tracked (count + last sent timestamp)
- All reminder activity is logged to the device timeline

---

## Product / Codename Tagging (TODO)

### What's Needed
When uploading an allocation list, we need to tag it with both:
- **Program:** Beta, Dogfood, PRQ, PVT, EVT, DVT
- **Product/Codename:** e.g., Merci, Foghorn, etc.

### Why
So you can easily identify "this upload was Beta for Merci" vs "Dogfood for Foghorn" in the history and filter devices by product.

### Implementation Plan
- Add a hardcoded product dropdown next to the Program selector in the Shipments upload form
- Tag each device and shipment record with the product name
- Show it in the upload history: `📄 file.xlsx · Beta · Merci · 16 devices`
- Add a product filter to the Devices tab

### Action
Next time a list is uploaded, provide the product/codename options and they'll be added to the dropdown.
