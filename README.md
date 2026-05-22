# Beta Inventory Dashboard

A Next.js web application for managing beta/dogfood device inventory, tester assignments, program lifecycle, and shipment tracking for the eero hardware testing team.

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
- Admin ID links to `https://admin.e2ro.com/users/{id}`
- Network ID links to `https://insight.eero.com/networks/{id}`

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
- Close programs: choose per-device action (archive, brick & return, return)
- Bricking calls eero Partner API (`POST /2.2/eeros/:id/activation_state`)
- Generates return emails to testers
- Archived programs preserve full device/tester history with clickable serials

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
| eero Admin | `https://admin.e2ro.com/users/{uid}` | Device admin panel |
| eero Insight | `https://insight.eero.com/networks/{networkId}` | Network dashboard |
| eero Partner API | `https://api-user.e2ro.com/2.2/` | Network sync, device bricking |

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

- Data is browser-local (localStorage). No server-side persistence or multi-user sync.
- Partner API integration is stubbed — sync button simulates the flow but doesn't make real API calls without a configured token.
- `react-simple-maps` lacks TypeScript declarations (suppressed with implicit any).
- The `DeactivateDeviceModal` has a minor type mismatch on the `end_of_program` reason enum.

## Backup Strategy

The project uses local git for version control. To create a backup:
```bash
git add -A && git commit -m "Backup: description of changes"
```

A copy of the project exists at:
`/Users/chavalln/Documents/Kiro/Beta Inventory Dashboard Copy 1`
