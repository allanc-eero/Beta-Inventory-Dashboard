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
- No database required to run locally — all data persists in browser localStorage via Zustand. (A shared production deployment will need server-side persistence + SSO — see `docs/Surveys_Feature_Handoff.md`.)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.4 |
| State management | Zustand 4.5 (persist middleware) |
| Design system | EDS — `@amzn/eero-web-design-components` + `-foundation` (tokens) |
| Styling | Tailwind CSS 3.4 (mapped to EDS tokens) |
| Auth (SSO) | NextAuth 4 — provider-agnostic OIDC (e.g. Okta), behind a seam |
| Maps | react-simple-maps 3 + d3-geo (centroids) |
| AI summaries | AWS Bedrock (`@aws-sdk/client-bedrock-runtime`) |
| Integrations | Qualtrics (surveys), JIRA (tickets), eero User/Admin API, Databricks (optional) |
| Icons / CSV | Lucide React / PapaParse |

## Architecture at a glance

- **Standalone Next.js app** (not embedded in Insight). Client UI + server-side API routes under `src/app/api/*` that talk to real integrations (or fall back to seeded data when creds are absent).
- **Dual-cloud, cohort-routed.** Beta → production eero cloud, dogfood → stage. A device's cohort (from `program`) decides which cloud its data sync and deep-links target. See `src/lib/format.ts` (`resolveEnv`) and `src/app/api/insight/route.ts`.
- **One shared model.** All tabs read/write a single device store, so a change shows up everywhere (Devices, People, Locations, Programs).
- **Everything is env-gated.** Each integration is live when its env vars are set, else it runs on a deterministic seed so the app always works. Prove readiness with `curl -s localhost:3000/api/health | jq`. See `.env.example`.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (wraps app in <Providers> for SSO)
│   ├── page.tsx                   # Auth gate + tab router (Devices/People/Locations/Programs/Ingestion)
│   ├── globals.css                # Tailwind + fonts + status badge styles
│   └── api/                       # Server routes (live integrations, seeded fallback)
│       ├── insight/               # eero dual-cloud device/network lookup + sync (prod/stage)
│       ├── auth/[...nextauth]/    # NextAuth OIDC handler (SSO)
│       ├── qualtrics/             # survey lists + completedResponse webhook
│       ├── summarize/ engagement/ # Bedrock AI summary / engagement feed
│       ├── jira/ jira-webhook/    # ticket creation + status webhook
│       └── databricks/ shapeshift/ breadboard/ health/ …
├── components/                    # 34 UI components (EDS-based). Key ones:
│   ├── Navbar.tsx                 # top bar: brand + Beta/Dogfood/All cohort switch + search
│   ├── DevicesTab.tsx             # device list, grouped into per-program containers (cohort-tagged)
│   ├── PeopleTab.tsx              # tester directory, profiles, opt-out/offboarding
│   ├── LocationsTab.tsx           # world map + regional stats (env-aware, centroid markers)
│   ├── programs/                  # Programs / Surveys / Engagement / Program Health (in-app "Programs" tab + /programs)
│   │   ├── ProgramsView.tsx       #   feature root (views, charts, panels, modals)
│   │   └── types.ts               #   shared types (DemoSurvey, DemoProgram, …)
│   ├── DeviceDetailPanel.tsx      # shared editable device panel (used across every menu)
│   ├── ShipmentsTab.tsx           # ingestion (CSV upload) + Archived returns
│   ├── LoginPage.tsx              # SSO sign-in when configured, else @eero.com email (dev)
│   ├── Providers.tsx              # SessionProvider + SSO→roster bridge
│   └── … (modals, panels, banners, AgentChat, SearchModal, SeedDataProvider)
├── lib/
│   ├── format.ts                  # env-aware deep-links (resolveEnv) + name/date helpers
│   ├── networkSync.ts             # runDeviceSync — dual-cloud, groups serials by network
│   ├── auth.ts                    # NextAuth OIDC config (gated on OIDC_ISSUER)
│   ├── engagement.ts / summarize.ts / bedrock.ts  # live-vs-seed seams for engagement + AI
│   └── dogfoodInventory.ts
├── store/
│   ├── deviceStore.ts             # devices, profiles, sync metadata, lifecycle actions
│   ├── authStore.ts               # roster + roles (authorization layer)
│   ├── uiStore.ts                 # global cohort lens (Beta/Dogfood/All) + cohortOf/matchesCohort
│   └── programsStore.ts
├── data/seedData.ts               # seed testers/devices (deterministic demo data)
├── constants/index.ts             # shared constants incl. APP_NAME, status config, CSV helper
└── types/index.ts                 # TypeScript interfaces (Device, Program, TesterProfile, …)
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

### Cohort lens (Beta / Dogfood / All)
- A global switch in the top bar filters the **whole app** to one cohort — Beta (prod), Dogfood (stage), or All (default)
- Applies across Devices, People, Locations, and Programs; device containers are tagged **Beta · prod** / **Dogfood · stage**
- Backed by `src/store/uiStore.ts` (`cohortOf` / `matchesCohort`); cohort derives from `Device.program`

### Device sync (dual-cloud)
- Resolves live online status + network per device from the eero **Admin API**, routed by cohort (beta → prod, dogfood → stage)
- Efficient: groups serials by known network and reads each network once (`nodes[]` → `status`/`firmware`); by-serial discovery only for unknown networks
- Runs after CSV upload and on a weekly cadence; falls back to seeded data with no creds

### Authentication (SSO)
- App-level **OIDC via NextAuth** — set `OIDC_ISSUER` (+ client id/secret) to enable SSO sign-in
- With SSO off (local dev), an `@eero.com` email login is used instead; the roster in `authStore` is the authorization layer (role/permissions)

## Data Model

### Core Types
- `Device` — 50+ fields covering hardware, assignment, logistics, shipment, contact
- `TesterProfile` — persistent per-person record (email, name, country, location, network, admin ID, programs)
- `Program` — one of: beta, dogfood, prq, pvt, evt, dvt, other
- `DeviceStatus` — online, not_online, in_repair, in_testing, deactivated

### Persistence
All state is stored in browser localStorage under the key `device-tracker-storage` (auth session under `auth-storage`). To reset, open Browser DevTools → Application → Local Storage → delete `device-tracker-storage`. Fresh seed data loads automatically when the store is empty.

## External Integrations

| Service | URL Pattern | Purpose |
|---------|------------|---------|
| eero Insight/Admin (prod, beta) | `insight.eero.com` / `admin.e2ro.com` `/networks/{id}` | Network + admin deep-links for beta |
| eero Insight/Admin (stage, dogfood) | `stage.insight.e2ro.com` / `admin.stage.e2ro.com` | Deep-links for dogfood (baked defaults; env-overridable) |
| eero Admin API (data) | `api-admin[.stage].e2ro.com` — `/eeros/serial/{s}`, `/networks/{id}` | Live device online status + network + firmware (dual-cloud) |
| Qualtrics | directory / surveys / responses webhook | Survey audience import + response ingestion |
| AWS Bedrock | Converse API | AI feedback summaries |

> **Deep-links and data are environment-aware.** Cohort decides the cloud — beta → prod, dogfood → stage — for both the UI links (`src/lib/format.ts` → `resolveEnv`) and the Admin-API data sync (`src/app/api/insight/route.ts`). Links need no credentials; the data sync needs one Admin API token per environment. Verified request shapes and go-live steps are in `docs/Surveys_Feature_Handoff.md`.

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

## Known Limitations & go-live checklist

- **Persistence:** data is browser-local (localStorage) — single-user. A shared deployment needs a server-side store + a weekly sync scheduler.
- **Live device data:** the Admin-API sync runs on a deterministic **seeded fallback** until `EERO_ADMIN_API_TOKEN_PROD` / `_STAGE` are set. The request shapes are **verified against prod + stage** (see the handoff doc); hosts default to `api-admin[.stage].e2ro.com`.
- **SSO:** OIDC is wired but dormant until `OIDC_ISSUER` (+ client id/secret + `AUTH_SECRET`) are set; local dev uses the `@eero.com` email login. Which IdP flow to use (Okta app-level vs Midway-at-edge) depends on the deployment host — see the handoff doc.
- **Types:** `react-simple-maps` ships no TypeScript types (local shim in `src/types/react-simple-maps.d.ts`); `d3-geo` uses the real `@types/d3-geo`.

## Version control

Tracked in git and pushed to two GitHub remotes:
- `origin` → the working repo (branch `surveys-engagement-demo`)
- `standalone` → **[allanc-eero/eero-fetch](https://github.com/allanc-eero/eero-fetch)** (private; `main`) — the shareable standalone repo

Full engineering history, decisions, verified API shapes, and remaining go-live steps live in **`docs/Surveys_Feature_Handoff.md`**.
