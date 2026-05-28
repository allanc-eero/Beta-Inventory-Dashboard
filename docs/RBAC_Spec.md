# RBAC Specification — Role-Based Access Control

## Roles

| Role | Count | Description |
|------|-------|-------------|
| **Super Admin** | 1 (you) | Full platform control. Code changes, UI modifications, user management, all destructive actions. |
| **Admin** | 2 | Can brick devices, archive devices, close programs, send return emails, process regions. Cannot modify code/UI or manage other admins. |
| **Operator** | 2 | Day-to-day management. Upload shipments, add devices, run network sync, edit device details, manage tester profiles, send emails. Cannot brick, close programs, or manage users. |
| **Viewer** | Unlimited | Read-only. Can see all devices, programs, people, history. Cannot make any changes. |

Testers: Not included in this phase. Future consideration.


## Permissions Matrix

| Action | Super Admin | Admin | Operator | Viewer |
|--------|:-----------:|:-----:|:--------:|:------:|
| View all devices | ✓ | ✓ | ✓ | ✓ |
| View all programs | ✓ | ✓ | ✓ | ✓ |
| View all people/profiles | ✓ | ✓ | ✓ | ✓ |
| View device detail | ✓ | ✓ | ✓ | ✓ |
| View device timeline | ✓ | ✓ | ✓ | ✓ |
| View pending returns | ✓ | ✓ | ✓ | ✓ |
| Search | ✓ | ✓ | ✓ | ✓ |
| Export CSV | ✓ | ✓ | ✓ | ✓ |
| Click Insight/Admin links | ✓ | ✓ | ✓ | ✓ |
| | | | | |
| Add device | ✓ | ✓ | ✓ | ✗ |
| Edit device details | ✓ | ✓ | ✓ | ✗ |
| Upload shipments/allocations | ✓ | ✓ | ✓ | ✗ |
| Import CSV | ✓ | ✓ | ✓ | ✗ |
| Run network sync | ✓ | ✓ | ✓ | ✗ |
| Add/edit tester profiles | ✓ | ✓ | ✓ | ✗ |
| Send return emails | ✓ | ✓ | ✓ | ✗ |
| Send follow-up reminders | ✓ | ✓ | ✓ | ✗ |
| Confirm device received | ✓ | ✓ | ✓ | ✗ |
| Record opt-out / opt-in | ✓ | ✓ | ✓ | ✗ |
| | | | | |
| Brick devices | ✓ | ✓ | ✗ | ✗ |
| Archive devices | ✓ | ✓ | ✗ | ✗ |
| Close/process programs | ✓ | ✓ | ✗ | ✗ |
| Process region (brick/archive) | ✓ | ✓ | ✗ | ✗ |
| Bulk return (with brick option) | ✓ | ✓ | ✗ | ✗ |
| | | | | |
| Manage users (add/disable/change roles) | ✓ | ✗ | ✗ | ✗ |
| Clear all data | ✓ | ✗ | ✗ | ✗ |
| Modify platform code/UI | ✓ | ✗ | ✗ | ✗ |


## Authentication

| Setting | Value |
|---------|-------|
| Login method | Email + verification code |
| Email domain | @eero.com |
| Session duration | 30 days (stay logged in) |
| Logout | Manual (button in nav) |
| Failed attempts | Lock after 5 failed codes, unlock after 15 min |

### Login Flow
1. User enters their @eero.com email
2. System sends a 6-digit code to that email
3. User enters the code
4. Session created, stored in httpOnly cookie
5. Session persists for 30 days unless manually logged out


## UI Behavior Per Role

### Viewer sees:
- All tabs visible (Devices, Programs, People, Device Ingestion & Returns, Locations)
- All data visible (devices, profiles, history, programs)
- No "Add Device" button
- No "Close Program" button
- No "Brick & Return" / "Archive" buttons
- No "Return selected" button
- No edit buttons on device detail
- No "Upload Allocation" form
- Export buttons still work (CSV downloads)
- A subtle "View Only" badge in the nav bar

### Operator sees:
- Everything Viewer sees, plus:
- "Add Device" button
- "Upload Allocation" form
- "Edit details" on device panel
- "Return selected" button (opens Bulk Return — but brick checkbox is disabled/hidden)
- "Send Reminder" buttons
- "Confirm Received" buttons
- Network Sync button
- Import CSV functionality
- Cannot see: "Brick & Return" option, "Close Program" button, "Archive selected" button

### Admin sees:
- Everything Operator sees, plus:
- "Brick & Return" option in all flows
- "Close Program" button on programs
- "Archive selected" button
- Per-region "Process" buttons
- "Brick Device" button on overdue escalation
- Full preview/diff modal with "Confirm & Execute"

### Super Admin sees:
- Everything Admin sees, plus:
- User management panel (add users, assign roles, disable accounts)
- "Clear All Data" button
- Access to platform settings


## Audit Trail

Every action records:
- `user`: The email of the logged-in person (not "Admin")
- `timestamp`: When it happened
- `action`: What was done
- `description`: Human-readable detail

Example: `"shkahma@eero.com bricked device GGC54MX36114004L — region: Australia. Program: beta"`


## Account Lifecycle

| Event | Action |
|-------|--------|
| New team member | Super Admin creates account, assigns role |
| Role change | Super Admin updates role, takes effect immediately |
| Person leaves team | Super Admin disables account (not deleted) |
| Disabled account | Cannot log in, audit trail preserved, data intact |
| Re-hire / return | Super Admin re-enables account |


## What I Need From You to Implement

1. **Your @eero.com email** — to set as Super Admin
2. **The 2 Admin emails** — people who can brick/archive
3. **The 2 Operator emails** — people who manage day-to-day
4. **Any initial Viewer emails** — or we can add them later

That's all. Once I have those 5-6 emails, I can build the auth system with the roles pre-configured.


## Implementation Plan

### Phase 1: Auth + Roles (build now as spec, implement when going to production)
- Login page with email + code
- User table in database (email, role, status, createdAt)
- Session management (cookie-based)
- Role check middleware on all actions

### Phase 2: UI Gating
- Wrap destructive buttons in role checks
- Hide/disable based on current user's role
- Show "View Only" indicator for Viewers

### Phase 3: Audit Trail Update
- Replace all `user: 'Admin'` with actual logged-in user email
- Show who did what in device timelines

### Phase 4: User Management UI
- Super Admin panel to add/disable/change roles
- List of all users with their roles and last login
