# RBAC Specification — Role-Based Access Control

## Roles (Simplified — 3 Active Roles)

| Role | Count | Description |
|------|-------|-------------|
| **Super Admin** | 1 | Full platform control. Code changes, UI modifications, user management, all destructive actions. |
| **Admin** | 1 | Can brick devices, archive devices, close programs, upload shipments, edit devices, send return emails, process regions. Cannot manage users or modify code/UI. |
| **Viewer** | Unlimited | Read-only. Can see all devices, programs, people, history. Can export CSVs. Cannot make any changes. |

**Operator role:** Reserved for future use. Can be activated when someone joins who needs edit access but should NOT brick/archive. Not currently assigned.

**Tester role:** Not included in this phase. Future consideration.


## User Roster

| Email | Role | Status |
|-------|------|--------|
| allanc@eero.com | Super Admin | Active |
| haley.swanson@eero.com | Admin | Active |
| aaron@eero.com | Viewer | Active |
| deep@eero.com | Viewer | Active |
| josht@eero.com | Viewer | Active |
| lalitha@eero.com | Viewer | Active |
| melanie.thorum@eero.com | Viewer | Active |
| shelby@eero.com | Viewer | Active |
| vrabago@eero.com | Viewer | Active |
| diego.kim@eero.com | Viewer | Active |
| john.pelebo@eero.com | Viewer | Active |
| layton.hill@eero.com | Viewer | Active |
| philip.rivera@eero.com | Viewer | Active |


## Permissions Matrix

| Action | Super Admin | Admin | Viewer |
|--------|:-----------:|:-----:|:------:|
| View all devices | ✓ | ✓ | ✓ |
| View all programs | ✓ | ✓ | ✓ |
| View all people/profiles | ✓ | ✓ | ✓ |
| View device detail | ✓ | ✓ | ✓ |
| View device timeline | ✓ | ✓ | ✓ |
| View pending returns | ✓ | ✓ | ✓ |
| Search | ✓ | ✓ | ✓ |
| Export CSV | ✓ | ✓ | ✓ |
| Click Insight/Admin links | ✓ | ✓ | ✓ |
| | | | |
| Add device | ✓ | ✓ | ✗ |
| Edit device details | ✓ | ✓ | ✗ |
| Upload shipments/allocations | ✓ | ✓ | ✗ |
| Import CSV | ✓ | ✓ | ✗ |
| Run network sync | ✓ | ✓ | ✗ |
| Add/edit tester profiles | ✓ | ✓ | ✗ |
| Send return emails | ✓ | ✓ | ✗ |
| Send follow-up reminders | ✓ | ✓ | ✗ |
| Confirm device received | ✓ | ✓ | ✗ |
| Record opt-out / opt-in | ✓ | ✓ | ✗ |
| Brick devices | ✓ | ✓ | ✗ |
| Archive devices | ✓ | ✓ | ✗ |
| Close/process programs | ✓ | ✓ | ✗ |
| Process region (brick/archive) | ✓ | ✓ | ✗ |
| Bulk return (with brick option) | ✓ | ✓ | ✗ |
| | | | |
| Manage users (add/disable/change roles) | ✓ | ✗ | ✗ |
| Clear all data | ✓ | ✗ | ✗ |
| Modify platform code/UI | ✓ | ✗ | ✗ |


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
- All data visible (devices, profiles, history, programs, pending returns)
- All links clickable (Insight, Admin, serial numbers, tester names)
- Export/download buttons work (CSV exports)
- No "Add Device" button
- No "Close Program" button
- No "Brick & Return" / "Archive" buttons
- No "Return selected" button
- No edit buttons on device detail
- No "Upload Allocation" form
- No "Confirm Received" button
- A subtle "View Only" badge in the nav bar next to their name

### Admin sees:
- Everything — full access to all features
- All buttons active
- Can brick, archive, close programs, upload, edit, send emails
- Cannot see: User management panel (Super Admin only)

### Super Admin sees:
- Everything Admin sees, plus:
- User management panel (add users, assign roles, disable accounts)
- "Clear All Data" button
- Platform settings


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


## Adding Users in the Future

Super Admin (allanc@eero.com) can add new users at any time through the User Management panel:
1. Enter their @eero.com email
2. Select role (Admin or Viewer)
3. They receive a login invitation email
4. They're immediately active once they verify

To promote a Viewer to Admin, or add the Operator role later, Super Admin changes their role in the panel — takes effect immediately.


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
