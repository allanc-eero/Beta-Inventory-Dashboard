# TODO — Feature Backlog

## Priority 1: Need Soon

### 0a. AI Agent — Upgrade to AWS Bedrock (Claude)
- [ ] Get console access to `eero-token-vending` AWS account (ID: `127696279518`) — ask account owner
- [ ] Enable Claude models in Bedrock → Model Access (request access for Claude 3 Haiku + Sonnet)
- [ ] Once enabled, swap local engine in `/api/agent/route.ts` back to Bedrock client (code already exists in git history)
- [ ] Test with: "Who has serial GGC54MX36114004L?" — should return natural language answer
- **Why:** Local engine handles common patterns but can't do freeform reasoning. Bedrock Claude makes the agent truly conversational — handles follow-ups, complex queries, and process guidance without predefined patterns.

### 0. Email System — Replace mailto: with Real Email Integration
- [ ] The current email system uses `mailto:` links — no delivery confirmation, no threading, no proof of delivery
- [ ] Logging "email sent" gives false confidence — you only know the mail client opened, not that it was delivered
- [ ] Integrate with `beta-teams@eero.com` via API (Amazon SES, SMTP relay, or Salesforce email API)
- [ ] Add delivery status tracking: sent, delivered, opened, bounced
- [ ] Thread follow-up reminders under the original email
- [ ] Store sent email content server-side for audit trail (not just in localStorage)
- **Why:** If this goes to production, you need proof that testers were actually contacted. A mailto: link is a demo convenience, not a production email system. Without real delivery tracking, you can't escalate with confidence ("we emailed them 3 times and they never responded").

### 1. User Authentication / Login
- [ ] Add login system so each team member has their own account
- [ ] JIRA tickets, audit trail, and deactivation records show the actual user who performed the action
- [ ] Role-based access (Admin vs. read-only)
- [ ] Session management (stay logged in, logout)
- **Why:** Right now everything runs as "Admin" — no accountability for who did what

### 2. Dashboard Export / Reporting
- [ ] "Download CSV" button on the Devices tab that exports the current filtered view
- [ ] Export options: all devices, filtered by program, filtered by status
- [ ] Include key fields: serial, model, assignee, status, program, firmware, location
- [ ] Scheduled reports (e.g., weekly email with device status summary)
- **Why:** Leadership asks "how many devices are online?" — you shouldn't have to count manually

### 3. Tester Self-Service Portal
- [ ] Simple page where testers can log in and see their assigned devices
- [ ] Show device status, due dates, and any overdue alerts
- [ ] "Confirm receipt" button so testers can mark when they've received a shipment
- [ ] Reduces back-and-forth emails between you and testers
- **Why:** Testers constantly ask "what's my device serial?" or "did you ship it yet?"

### 4. RBAC (Role-Based Access Control)
- [ ] Define roles: Admin, Operator, Viewer, Tester
- [ ] Admin — full access (deactivate, close programs, manage users, upload shipments)
- [ ] Operator — upload shipments, view all devices, run sync, add devices (no deactivate/close programs)
- [ ] Viewer — read-only (see devices, status, history, no changes)
- [ ] Tester — see only their own devices, confirm receipt, view their status
- [ ] Auth layer with email login (email + verification code, or SSO integration)
- [ ] Role assignment UI (Admin assigns roles to other users)
- [ ] UI gating (hide/disable buttons and tabs based on role)
- [ ] Audit trail shows actual logged-in user for all actions
- [ ] Middleware route protection (block unauthorized API/page access)
- **Why:** Right now everything runs as "Admin" — need accountability and access control before going live

---

## Priority 2: Nice to Have

### 4. Notifications / Activity Feed
- [ ] Wire up the bell icon in the nav bar
- [ ] Show a feed of recent activity: devices came online, deactivations, shipments uploaded
- [ ] Filterable by type (shipments, status changes, JIRA activity)
- [ ] Optional: email/Slack notifications for critical events (device went offline, overdue)
- **Why:** Right now you have to manually check each section to see what changed

### 5. Search Improvements
- [ ] Global search across devices, shipments, JIRA tickets, and history
- [ ] Search by tester name shows all their devices + shipments + tickets in one view
- [ ] Search by tracking number finds the shipment
- [ ] Recent searches / saved filters
- **Why:** Current search only works within the Devices tab

### 6. Map View for Locations
- [ ] Visual map showing where devices are geographically (AUS, EU, UK, US)
- [ ] Color-coded pins: green = online, yellow = offline, red = deactivated
- [ ] Click a region to see devices in that area
- [ ] Useful for logistics planning and seeing coverage gaps
- **Why:** You have testers across 4+ regions — a visual helps with planning

### 7. CMDB Information Architecture
- [ ] Formalize the data model with proper parent/child relationships
- [ ] Device is the primary Configuration Item (CI) — everything relates to it
- [ ] Make Program a first-class object with its own lifecycle (active → completed → archived)
- [ ] Define relationship types between objects (see architecture below)
- [ ] Migrate from flat string fields to proper relational references
- [ ] Add validation to prevent orphaned records (e.g., device without a program)
- [ ] Plan for database migration (localStorage → proper DB) to support relational queries
- **Why:** As the platform grows, a flat data model breaks down. Proper CMDB structure ensures data integrity, enables reporting, and makes the system scalable.

#### Target Object Hierarchy
```
Organization (eero)
  └── Program (Beta-Merci, Dogfood-Foghorn, etc.)
        ├── status: active | completed | archived
        ├── product: Merci, Foghorn, etc.
        ├── start_date, end_date
        └── Devices[] (1:many)

Device (primary CI — the eero unit)
  ├── serial_number (unique identifier)
  ├── Belongs to: Program (many:1)
  ├── Assigned to: Person (many:1)
  ├── Arrived via: Shipment (many:1)
  ├── Located at: Location (many:1)
  ├── Connected to: Network (1:1)
  ├── Has: Tickets[] (1:many)
  ├── Has: Attachments[] (1:many)
  ├── Has: SpeedTests[] (1:many)
  └── Has: HistoryEntries[] (1:many)

Person
  ├── email (unique identifier)
  ├── Has: Devices[] (1:many)
  └── Has: Role (for RBAC)

Shipment
  ├── id (unique)
  ├── Contains: Devices[] (1:many)
  ├── carrier, tracking, dates
  └── Uploaded from: File

Network (from Partner API)
  ├── network_id (from eero API)
  ├── Has: Device (1:1 — gateway)
  └── health_status, speed_tests
```

#### Migration Path (how to get there)
1. **Phase 1 (now):** Keep current localStorage + Zustand setup. It works for <1000 devices.
2. **Phase 2 (soon):** Move to a real database (PostgreSQL or DynamoDB). Add proper foreign keys and indexes. This unlocks relational queries ("show me all devices in Beta that are offline").
3. **Phase 3 (scale):** Add an API layer between frontend and database. This enables the tester self-service portal, mobile access, and integrations (JIRA API, email API, Partner API) to run server-side.
4. **Phase 4 (mature):** Event-driven architecture — device status changes trigger automated workflows (notifications, JIRA creation, email alerts) without manual intervention.

#### Key Decisions to Make
- **Database choice:** PostgreSQL (relational, good for CMDB) vs. DynamoDB (serverless, scales easily on AWS)
- **Hosting:** Vercel (simple) vs. AWS (more control, closer to internal tools)
- **Auth provider:** Amazon internal SSO (Midway) vs. NextAuth with email login
- **JIRA integration:** REST API direct calls vs. webhook-based sync

---

## Completed Features ✓

- [x] Device list with search and filters
- [x] Device detail page with full info
- [x] Shipments tab with Excel upload
- [x] Daily network status sync via Partner API
- [x] Overdue device alerts
- [x] Firmware version tracking
- [x] Device timeline / audit log
- [x] Health regression detection
- [x] JIRA integration (auto-create tickets)
- [x] Deactivation workflow ("Return to eero") — full page form
- [x] Return email + shipping label generation
- [x] Brick device only for lost/unrecoverable
- [x] File attachments on devices
- [x] Programs tab with "Close Program" flow (replaced Testbeds)
- [x] Print label in shipment flow
- [x] Pipeline status tracking (In Transit → Not Online → Online)
- [x] Fixed navbar with widgets (bell, settings, avatar)
- [x] Add Device form (simplified, API fills in details on sync)
- [x] Shipment history with file upload tracking
- [x] Local data caching to avoid API flooding (24h TTL, rate limit detection, auto-sync)
- [x] Sync metadata tracking (last sync time, stale detection, backoff)
- [x] Select all / deselect all in device list
- [x] Edit device action from checkbox selection
- [x] Program field applied to all devices on upload
- [x] JIRA tickets created for every return (any reason) with correct epic
- [x] Dynamic confirmation UI (red warning only for brick/lost)
- [x] Removed unused features (Import tab, Check Out/In flow, factory reset)

---

## Launch Checklist — APIs to Enable When Going Live

All features currently run with simulated API calls (setTimeout delays). When launching for real, replace these simulations with actual API integrations:

### Partner API Connections
- [ ] **Network Status Sync** — Replace `fetchOnlineDevicesFromAPI()` in `NetworkSyncButton.tsx` with real `fetch()` calls to:
  - `GET /2.2/organizations/self/networks/administered`
  - `GET /2.2/networks/:id/eeros` (check `status === 'green'`)
- [ ] **Auto-populate Admin ID & Network ID on sync** — When the sync discovers a device online:
  - Extract `network_id` and `unit_id` (UID) from the API response for each eero
  - Save to the device record (`network`, `unitId` fields)
  - Update the tester profile with these IDs so they carry forward to future programs
  - This is how new testers get their Insight/Admin links populated automatically — no manual entry needed
  - API response fields to extract: `url` (network URL), `serial`, `model_number`, `id` (eero ID)
- [ ] **Device Bricking** — Replace `setTimeout` in `DeactivateDeviceModal.tsx` and `BulkReturnPanel.tsx` with:
  - `POST /2.2/eeros/:id/activation_state` with `{ "active": false }`
- [ ] **Firmware Push** — Replace `setTimeout` in `FirmwarePanel.tsx` with:
  - `POST /2.2/networks/:id/updates`
- [ ] **Speed Tests** — Replace simulated results in `HealthPanel.tsx` with:
  - `POST /2.2/networks/:networkId/speedtest`
  - `GET /2.2/networks/:networkId/speedtest`

### External Service Integrations
- [ ] **JIRA API** — Replace local `createJiraTicket()` with actual JIRA REST API calls to create real tickets
- [ ] **Salesforce API** — Connect to Salesforce to pull cases linked to device serial numbers
  - Query cases by `Device Serial Number` field in Salesforce
  - Display case number, status, subject, priority, date on device detail panel
  - Shake-to-report tickets from testers arrive in SF first, then escalate to JIRA if serious
  - API endpoint: Salesforce REST API (`/services/data/vXX.0/query?q=SELECT...FROM Case WHERE Device_Serial__c='...'`)
- [ ] **Email Service** — Replace `mailto:` links with server-side email sending (Amazon SES or SendGrid)
- [ ] **Shipping Labels** — Replace HTML label generation with actual carrier API (UPS/FedEx) for pre-paid labels

### Infrastructure
- [ ] **Database** — Migrate from localStorage to PostgreSQL/DynamoDB
- [ ] **Dogfooder Accounts in Database** — Move registered dogfooder accounts from localStorage to Supabase or DynamoDB so accounts persist across browsers/devices and aren't lost on cache clear. Include: email, name, role, registeredAt, firstLoginAt, status.
- [ ] **API Layer** — Add Next.js API routes as backend (store API tokens server-side)
- [ ] **Authentication** — Add real login (NextAuth or internal SSO)
- [ ] **Scheduled Sync** — Set up daily cron job for network status sync (replace manual button)
- [ ] **Environment Variables** — Store all API tokens/secrets in env vars, not in code

### Data Migration
- [ ] **Export current localStorage data** before switching to database
- [ ] **Import seed data** into new database
- [ ] **Verify all historical records** (timelines, shipments, closed programs) migrated correctly

### Testing Before Launch
- [ ] Test bricking on a single non-production device first
- [ ] Verify email delivery to a test address
- [ ] Confirm JIRA tickets appear in correct epics
- [ ] Run a full sync and verify device counts match RNM
- [ ] Test with 2+ simultaneous users to confirm shared state works

---

## Security Audit Items (Added 2026-06-07)

### 🔴 High Priority
- [ ] **Environment Variables** — All API tokens (Partner API, JIRA, Salesforce, email) must be in `.env.local` or server-side env vars, never hardcoded in source
- [ ] **Verify `.env.local` is in `.gitignore`** — Confirm secrets file is excluded from git
- [ ] **No secrets in localStorage** — Ensure API tokens are never stored client-side; all authenticated API calls should go through Next.js API routes (server-side)

### 🟡 Medium Priority
- [ ] **npm audit fix** — Run `npm audit fix` to resolve known vulnerabilities in dependencies
- [ ] **Dependency pinning** — Ensure `package.json` uses exact versions (not `^` ranges) for security-sensitive packages
- [ ] **CORS / API route protection** — When API routes go live, restrict to authenticated users only (no open endpoints)
- [ ] **Rate limiting on API routes** — Prevent abuse of sync, bricking, and email endpoints
- [ ] **Input validation on device serial numbers** — Sanitize all user inputs (CSV uploads, Add Device form, search) to prevent injection
- [ ] **Audit trail integrity** — History/timeline entries should be append-only and tamper-evident once database is live

### 🟢 Before Production Launch
- [ ] **Security review with Amazon AppSec** — If hosting internally, submit for security review
- [ ] **Data classification** — Serial numbers, tester emails, and network IDs are confidential; ensure proper handling per Amazon data classification policies
- [ ] **Session timeout** — Auto-logout after inactivity (when auth is added)
- [ ] **HTTPS only** — Ensure production deployment is HTTPS with valid cert (no HTTP fallback)
- [ ] **Prototype security compliance** — Confirm that the bricking workflow meets Amazon's prototype security requirements (EVT/DVT reclamation policy)
- [ ] **PII handling** — Tester names, emails, phone numbers, and addresses require proper data retention and deletion policies per Amazon privacy guidelines

### 🔧 Integration Security (for Kiro agent hooks)
- [ ] **Connect dashboard to "Tester Setup Outreach" hook** — Expose an endpoint or data export that shows devices received but not online, so the hook can identify non-setup testers
- [ ] **Connect dashboard to "Hardware Reclamation Tracker" hook** — Expose serial number + tester mapping so the hook can cross-reference against CEVA returns data
- [ ] **Read-only API for hooks** — Create a read-only API endpoint that Kiro hooks can query for device status without write access
- [ ] **Webhook for status changes** — When a device goes online/offline/deactivated, fire a webhook that could trigger Slack notifications or hook actions
