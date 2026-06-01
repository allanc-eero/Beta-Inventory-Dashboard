Beta Inventory Dashboard — Project Overview

What Is This?

The Beta Inventory Dashboard is a web-based tool built to manage the full lifecycle of eero hardware devices that get shipped to testers across beta, dogfood, PVT, EVT, DVT, and other testing programs. It replaces the manual spreadsheet tracking process with a centralized platform where you can see every device, who has it, what program it belongs to, and whether it's online or not.

It runs locally in a browser with role-based access control. All data persists in the browser's local storage.


Who Can Access It

| Role | People | What they can do |
|------|--------|-----------------|
| Super Admin | allanc@eero.com | Everything — manage users, brick, archive, edit, upload |
| Admin | haley.swanson@eero.com | Brick, archive, close programs, upload, edit, send emails |
| Viewer | 11 team members | View all data, export CSVs. Cannot make changes. |

Login is via @eero.com email. Viewers see a "VIEW ONLY" badge and all action buttons are hidden.


How Data Gets In

Upload an Excel file (.xlsx) or CSV to the Device Ingestion & Returns tab. The system reads these columns:

| Column | Required? | What it does |
|--------|-----------|-------------|
| First Name | Yes | Combined with Last Name for "Assigned To" |
| Last Name | Yes | Combined with First Name |
| Product | Yes | e.g., "Foghorn" — the hardware product |
| Phase | Yes | e.g., "PVT" — the testing stage |
| Email | Yes | Links to tester profile, auto-fills known info |
| Tracking | Yes | Shipment tracking number |
| Serial Number | Yes | Creates the device |
| Insight Network Link | Optional | Extracts network ID for Insight links |
| Address | Optional | Tester's location |
| Country | Optional | Used for region grouping |

The filename is also read: "Foghorn PVT.xlsx" auto-sets Product = Foghorn, Phase = PVT.

Product is a free-text field — type any product name and it becomes available for future uploads. Phase is a fixed set: Beta, Dogfood, PVT, EVT, DVT, PRQ, Other.


What You See When You Log In

Admins see the "Today Briefing" — a prioritized action list:
- Overdue devices (2+ weeks pending return)
- Devices needing follow-up reminders (1 week)
- Programs partially closed
- Pending returns
- Recent opt-outs
- Devices that came online
- Activity feed (last 3 months of actions)

Viewers see stat cards: total devices, online, offline, countries.


Key Features

Devices Tab — Grouped by program (e.g., "Foghorn PVT · 15 devices"). Searchable, filterable by status and phase. Click any serial to see full device detail with editable fields, Insight/Admin links, return status, and device timeline.

Programs Tab — Shows active programs with device counts. "Close Program" flow lets you process by region or all at once. Full Bulk Return workflow with editable emails grouped by region, preview before execution, and persistent tracking of what's been processed.

People Tab — Tester profiles with stable Tester IDs (TST-XXXXX). Shows all emails, programs, devices, network IDs, admin IDs. Duplicate detection when adding new people. Opt-out tracking with reasons.

Device Ingestion & Returns — Upload allocations, track pending returns, confirm device receipt. Drag-and-drop file upload with auto-detection of product/phase from filename.

Tester Profiles — Persistent per-person records keyed by email. When a tester joins a new program, their country, location, contact email, network ID, and admin ID auto-fill from their profile. No re-entry needed.


How a Program Closes

1. Go to Programs → click "Close Program" (or "Continue Processing" if partially done)
2. Choose per-device actions: Brick & Return, Archive, or Return to eero
3. Use program-wide buttons for all devices, or per-region buttons for targeted processing
4. Each action opens the full Bulk Return flow: emails, preview, confirmation
5. Processed devices are tracked persistently — visible even after navigating away
6. Program only moves to "Archived" when every device is accounted for


Return & Escalation Flow

1. Return email sent → device marked as "Pending Return" (not deactivated)
2. Week 1: yellow reminder prompt appears on device detail
3. Week 2: red escalation — "Contact directly or brick"
4. Overdue stat card turns red, links to Pending Returns tab
5. Daily login popup reminds admin of outstanding items
6. "Confirm Device Received" button → marks as deactivated (only way to deactivate besides bricking)


Guardrails

- Every destructive action (brick, archive, close program) goes through a Preview modal showing exactly what will happen
- Large batches (10+ devices) get a warning recommending per-region processing
- Viewers cannot see or access any action buttons
- All emails sent from beta-teams@eero.com (linked to Salesforce)
- Full audit trail on every device showing who did what and when


External Links

- Admin ID → https://admin.e2ro.com/users/{id}
- Insight Network → https://insight.eero.com/networks/{id}
- Clickable throughout the app (device detail, tester profiles)


Tech Summary

- Next.js 14 (React) + TypeScript
- Tailwind CSS
- Zustand (state management, persists to localStorage)
- PapaParse (CSV), XLSX (Excel parsing)
- No backend server — runs entirely in browser
- To run: npm install → npm run dev → http://localhost:3000


Current Limitations

- Data is browser-local (localStorage). No multi-user sync.
- Email uses mailto: links — no delivery confirmation (production needs SES/SMTP)
- Partner API calls are simulated — network sync, bricking don't hit real endpoints without a token
- Admin ID / Network ID auto-population requires production API integration
