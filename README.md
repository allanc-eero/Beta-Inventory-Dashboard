# Beta Inventory Dashboard (eero Fetch)

A single control tower for eero's **beta and dogfood** hardware programs: track every tester device, link each one to its live network, run the survey/engagement loop, and manage the program lifecycle from ship → online → return.

---

## What this is

A web app for the team that runs eero's pre-release hardware testing. It answers the questions that are otherwise scattered across spreadsheets, Insight, Admin, Qualtrics, and email:

- Which devices are in the field, who has them, and are they **online**?
- Which network does a given serial live on, and how do I **jump straight to it**?
- How are testers **engaging** (survey responses, reliability), and who's **at risk**?
- What's the state of each **program** (deployed, % online, feedback), and how do returns get handled when it closes?

It unifies **device inventory + tester directory + program lifecycle + surveys/engagement + a geographic map**, all reading from one shared model so a change in one place shows up everywhere.

## The problem it solves

Beta and dogfood fleets are tracked by hand across disconnected tools. There's no one place that shows *every* tester device across *both* cohorts with a working link into its network and its engagement signal. This tool is that place.

## The ultimate goal

**One pane of glass across both tester cohorts, with a live jump into each device's network — and the surrounding workflow (surveys, engagement, program health, returns) that beta program managers actually run.** The north star is real-time device/network truth joined to tester engagement, so the team can spot an at-risk tester (device offline + surveys unanswered) before a program's data is compromised.

## Two cohorts, two clouds (important)

The two cohorts live in **different eero environments**, and the app routes to the right one automatically:

| Cohort | Environment | Insight / Admin |
|--------|-------------|-----------------|
| **Beta testers** | Production | `insight.eero.com` / `admin.e2ro.com` |
| **Dogfooders** | Stage | stage Insight / Admin (env-configured) |

Every deep-link is **environment-aware** (`resolveEnv` in `src/lib/format.ts`): a device's `environment` field decides the target, falling back to its cohort (`dogfood` → stage, else prod). Prod hosts are known; **stage hosts come from `NEXT_PUBLIC_INSIGHT_STAGE_URL` / `NEXT_PUBLIC_ADMIN_STAGE_URL`** and are left unset until the platform team confirms them (links render as plain text until then — never broken).

## Where this will live (hosting)

Current recommendation: **ship standalone (Harmony)**, because only a standalone app can reach *both* the prod and stage data planes and route links to each — an embed inside production Insight structurally can't see stage (dogfood) networks. We then buy back discoverability with an Insight launch entry point. See `docs/Surveys_Feature_Handoff.md` → "Hosting decision" for the full rationale and the three open questions for the eero platform team (credentials for both envs, stage hostnames, Harmony server-side posture).

## Status

Fully functional as a **demo/preview** with seeded data behind clearly-marked "simulated" seams. The UI, counts, links, and workflows are real and derive from one shared store; what's left to go fully live is the eero API sign-in + confirming data shapes + bulk device ingestion (tracked in the handoff doc). Nothing is merged into another product yet.

## Docs for engineers & partner teams

- **This README** — overview, setup, architecture, how to extend.
- **`docs/Surveys_Feature_Handoff.md`** — the deep engineering log: surveys/engagement build, device sync, env-aware linking, the standalone-vs-embed hosting decision, and every "to go live" hookup.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app runs at `http://localhost:3000`.

## Requirements

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- No database required — all data persists in browser localStorage via Zustand

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.4 |
| State Management | Zustand 4.5 (with persist middleware) |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| CSV Parsing | PapaParse 5.4 |
| Maps | react-simple-maps 3.0 |

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind + custom status badge styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page (tab router)
├── components/
│   ├── AddDeviceModal.tsx   # Manual device entry with profile auto-fill
│   ├── AttachmentsPanel.tsx # File attachments per device
│   ├── BulkReturnPanel.tsx  # Bulk device return workflow
│   ├── CheckoutTab.tsx      # Device checkout management
│   ├── DashboardStats.tsx   # Top-level stat cards (memoized)
│   ├── DeactivateDeviceModal.tsx # Return-to-eero workflow
│   ├── DeviceDetailPanel.tsx     # Full device info (data-driven fields)
│   ├── DeviceTimeline.tsx   # Device history timeline
│   ├── DevicesTab.tsx       # Main device list with search/filter
│   ├── FirmwarePanel.tsx    # Firmware version tracking
│   ├── HealthPanel.tsx      # Network health / speed tests
│   ├── ImportTab.tsx        # CSV import with upsert + tester profiles
│   ├── JiraPanel.tsx        # JIRA ticket integration
│   ├── LocationsTab.tsx     # Geographic device map
│   ├── Navbar.tsx           # Top navigation
│   ├── NetworkSyncButton.tsx # eero Partner API sync trigger
│   ├── OverdueAlertsBanner.tsx # Overdue device alerts
│   ├── PeopleTab.tsx        # Tester directory + opt-out tracking
│   ├── ProgramsTab.tsx      # Program lifecycle (active/close/archive)
│   ├── SearchModal.tsx      # Global search
│   ├── SeedDataProvider.tsx # Initial data seeding + profile creation
│   ├── ShipmentsTab.tsx     # Shipment tracking (Leg 1 & 2)
│   └── TestbedsTab.tsx      # Testbed management
├── data/
│   └── seedData.ts          # Seed data (AUS testers, devices)
├── store/
│   └── deviceStore.ts       # Zustand store (all state + actions)
└── types/
    └── index.ts             # TypeScript interfaces
```

## Key Features

### Device Management
- Full device lifecycle: add → assign → track → deactivate/return
- Clickable serial numbers throughout the app open the device detail panel
- Export individual device info as CSV
- **Environment-aware** Admin & Insight links: beta → production, dogfood → stage (see "Two cohorts, two clouds" above). Routing lives in `src/lib/format.ts` (`resolveEnv`)

### Tester Profiles (Auto-Fill)
- Persistent tester profiles keyed by email
- When a new device is assigned to a known email, the system auto-fills: name, country, location, contact email, alternate email, network ID, admin ID
- Profiles are created/updated automatically on every import
- Eliminates re-entry when testers join new programs

### CSV Import (Upsert)
- Drag-and-drop or file picker
- Flexible column name matching (supports multiple naming conventions)
- **Upsert by serial number**: existing devices are updated, new ones are added
- Auto-creates tester profiles from imported data
- See `docs/Device_Intake_Template.csv` for the recommended column format

### Program Lifecycle
- View active programs with device counts (total/online/offline)
- Close a program: its devices move to the **Archived** tab so each return is tracked individually (no bricking — devices stay usable; archived records are retained ~4 months after close)
- Generates return emails to testers
- Archived programs preserve full device/tester history with clickable serials

### Surveys, Engagement & Program Health
- **Surveys** are authored/sent in **Qualtrics**; responses flow back (webhook) and render here as charts + an AI feedback summary (Bedrock), with a closed loop to file a JIRA ticket from a response
- **Engagement & At-Risk** — reliability / response-time / feedback-quality per tester, and an at-risk view (device offline + surveys unanswered)
- **Program Health** — per-program deployed / % online / response rate / feedback quality, for both Hardware and Feature programs

### People Directory
- Search testers by name or email
- View all devices assigned to a person
- Record opt-outs with reason tracking
- Tester profiles carry data across programs

### Network Sync
- Polls eero Partner API to detect which devices have come online
- Updates device status from `not_online` → `online` based on network presence
- Stale indicator when sync hasn't run recently

## Data Model

### Core Types
- `Device` — 50+ fields covering hardware, assignment, logistics, shipment, contact
- `TesterProfile` — persistent per-person record (email, name, country, location, network, admin ID, programs)
- `Program` — one of: beta, dogfood, prq, pvt, evt, dvt, other
- `DeviceStatus` — online, not_online, in_repair, in_testing, deactivated

### Persistence
All state is stored in browser localStorage under the key `device-tracker-storage`. To reset:
1. Go to Import tab → "Clear All Data", or
2. Browser DevTools → Application → Local Storage → delete `device-tracker-storage`

Fresh seed data loads automatically when the store is empty.

## External Integrations

| Service | URL Pattern | Purpose |
|---------|------------|---------|
| eero Admin (prod) | `https://admin.e2ro.com/{users\|networks}/{id}` | Device/network admin panel (beta) |
| eero Insight (prod) | `https://insight.eero.com/networks/{networkId}` | Network dashboard (beta) |
| eero Admin/Insight (stage) | `NEXT_PUBLIC_ADMIN_STAGE_URL` / `NEXT_PUBLIC_INSIGHT_STAGE_URL` | Dogfood (stage) — env-configured, unset until platform confirms |
| eero User API | `https://api-user.e2ro.com/2.2/` (`EERO_USER_API_BASE`) | Device online-status sync (Insight-native) |
| Qualtrics | directory/surveys/responses | Survey audience import + response webhook |
| AWS Bedrock | Converse API | AI feedback summaries |

> **Deep-links are environment-aware.** Each link is routed to prod or stage by the device's `environment`/cohort (`src/lib/format.ts` → `resolveEnv`). Deep-links need no credentials; the live-status sync does (one credential per environment).

## Development Notes

### Adding New Device Fields
1. Add the field to `Device` interface in `src/types/index.ts`
2. Add it to `seedData.ts` builder function
3. Add it to `COLUMN_MAP` in `ImportTab.tsx` for CSV import support
4. Add it to the appropriate field array in `DeviceDetailPanel.tsx` (`DEVICE_FIELDS`, `ASSIGNMENT_FIELDS`, etc.)
5. Add it to `AddDeviceModal.tsx` device creation object
6. Add it to `ShipmentsTab.tsx` if it creates devices

### Adding New Programs
Add the program key to the `Program` type in `src/types/index.ts` and add a label entry in `PROGRAM_LABELS` in `ProgramsTab.tsx`.

### Column Mapping (Import)
The import system uses a declarative `COLUMN_MAP` array in `ImportTab.tsx`. Each entry is `[deviceField, [...possibleColumnNames]]`. To support a new column alias, just add it to the appropriate array.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |

## Known Limitations

- Data is browser-local (localStorage). No server-side persistence or multi-user sync yet (a real deployment needs a server-side store + scheduler — see the handoff doc).
- eero API sync runs on a deterministic **seeded fallback** until `EERO_API_TOKEN` (+ env base) is set; the live REST paths are marked `TODO(verify)`.
- **Stage deep-links are inert until configured** — set `NEXT_PUBLIC_INSIGHT_STAGE_URL` / `NEXT_PUBLIC_ADMIN_STAGE_URL` once the platform team confirms the stage hostnames.
- `react-simple-maps` ships no TypeScript types (local shim in `src/types/react-simple-maps.d.ts`); `d3-geo` uses the real `@types/d3-geo`.

## Backup Strategy

The project uses local git for version control. To create a backup:
```bash
git add -A && git commit -m "Backup: description of changes"
```

A copy of the project exists at:
`/Users/chavalln/Documents/Kiro/Beta Inventory Dashboard Copy 1`
