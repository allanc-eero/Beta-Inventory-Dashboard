# Surveys & Engagement Feature — Session Handoff

**Last updated:** 2026-08-28
**Status:** Flagship built as an isolated **demo/preview** (`/demo-surveys`). Live Qualtrics list import working. **New Program flow built** (create → audience import → first survey). **Survey lifecycle model built** — Program → Phase → Surveys, with kind/cadence, a New Survey modal, and a "Start new phase" template. **Nothing merged into the real app yet.**

Use this doc to resume where we left off. Read it top-to-bottom; it captures the full context, decisions, and the exact next step.

---

## Backup status (2026-08-30)

All work from the last session is **backed up to GitHub** on branch `surveys-engagement-demo`:
- **Commit `d5ca1a0`** — the Surveys & Engagement demo (`/demo-surveys`).
- **Commit `bdf92fa`** — the in-progress **EDS refactor** across ~34 components + config (`globals.css`, `tailwind.config.ts`, `tsconfig.json`), removal of the parked `/eds-demo` page, the `react-simple-maps` type shim, and `.kiro/EDS_REFACTOR_MAP.md`.

Local branch is in sync with `origin/surveys-engagement-demo`. **Not committed:** local `.claude/` tooling only (intentionally excluded — not part of the feature work). Note: this EDS-refactor commit is a work-in-progress snapshot for safekeeping; it was not gated on a full `tsc`/build pass.

---

## 1. The goal

> **DIRECTION CHANGE (2026-09-01): eero Fetch is a STANDALONE app, not an Insight feature.**
> Embedding in Insight was ruled out because the two cohorts live in different clouds —
> **beta devices/testers in production Insight, dogfood in stage Insight** — and a single
> embedded surface can't span both. As a standalone, Fetch owns its own data access and
> **links out** to the correct environment per device (see "Environment-aware deep-links").
> The EDS-native build still means a future Insight port would be cheap if that ever changes,
> but it is no longer the goal.

Mine features from a separate production app (`eero-beta-app-prod`, now cloned read-only at `.reference/eero-beta-app-prod`) and rebuild the valuable ones into **eero Fetch** (this app) — WITHOUT copying code. Everything must be:
- **Functional but explicitly understandable, so someone can demo it** (mock/seed data + visible "simulated" seams).
- **Standalone-first** — Fetch is its own product. It reaches **both** eero clouds itself (prod for beta, stage for dogfood) rather than being joined from Insight. Built with EDS components + tokens so it looks like eero and a future embed stays cheap, but shipping standalone is the plan.

**No database yet.** Currently localStorage/Zustand. A real multi-user standalone deployment will need server-side persistence + auth + a host — tracked as standalone workstreams below. Backend-dependent features are simulated behind the same `setTimeout` seam the app already uses until then.

---

## 2. The two apps (context)

- **eero Fetch (this app)** — device/hardware logistics. Next.js 14 App Router, Zustand + localStorage, EDS (`@amzn/eero-web-design-*`). Already has server-side API routes (`src/app/api/*`) calling real JIRA, Qualtrics, Databricks. Uses hand-built SVG charts (only d3 present, no recharts).
- **eero-beta-app-prod (reference only)** — engagement platform (surveys, cohorts, badges, discussions, AI summaries). Express + PostgreSQL + JWT. **Key finding: it already abandoned its homegrown survey builder and moved to Qualtrics** (migration 027 says the native survey tables are deprecated). So we do NOT rebuild a survey engine — we lean on Qualtrics.

---

## 3. Decisions locked

1. **Flagship = Surveys (Qualtrics-backed).** One feature done well. Second = Engagement view. Third = AI response summary.
2. **AI summary = survey feedback summary only** (themes/sentiment/issues/requests/actions). Rules engine computes facts; AI only narrates language. Not an engagement summary.
3. **Surveys come from Qualtrics.** Device/network telemetry comes from the **eero API directly** (prod + stage), fetched by Fetch's own server routes — NOT joined from an Insight embed. (Superseded the earlier "Insight is the eventual home" plan — see Direction Change above.)
4. **Data-model merge:** don't import their `beta_testers` table — eero Fetch already has People/`TesterProfile`. Only add ~5 fields to `TesterProfile`: `reliability`, `avgResponseDays`, `feedbackQuality` (engagement), `technicalLevel`, `industryKnowledge` (targeting). Engagement scores are *derived from survey activity* and must show how they're computed.
5. **Cohort = a Program's testers.** Do NOT add a separate "cohort" concept. A survey targets a Program (or a saved segment). Keeps it one app.
6. **Feature testing:** programs have a **type: Hardware | Feature**. Feature programs ship no devices — participation + surveys are the whole interaction. Surveys span both types.
7. **Join key = email** (optionally a stable `testerId` as Qualtrics embedded data). Qualtrics responses/contacts join back to People by email.
8. **Say NO to** badges and discussions (vitamin, not painkiller; no tester-facing surface here).
9. **Robustness additions worth building (ranked):** (a) **At-Risk view** — intersection of device-offline + survey-unresponsive + low reliability (the flagship cross-signal, now owned by Fetch itself rather than Insight); (b) **closed loop** — survey response → JIRA ticket; (c) **program-health report** for leadership.

---

## 4. What's built (ISOLATED — real app untouched)

- **`src/app/demo-surveys/page.tsx`** — self-contained demo page. Four views via EDS `Segmented`:
  1. **Surveys** — list (status filter, response-rate bars) → results view: stat row, ✨ AI Feedback Summary (simulated), per-question charts (rating bars, choice bars, yes/no donut), and **"Create JIRA ticket"** on negative text responses (closed loop).
  2. **Import from Qualtrics** — dropdown of **live** Qualtrics directory lists → pick a list + target program → import contacts as participants (matched by email).
  3. **Engagement & At-Risk** — rules engine flags reclaim candidates + ✨ AI narration; tester engagement table (reliability/response time/feedback quality/technical level).
  4. **Program Health** — per-program deployed / % online / response rate / feedback quality; handles Hardware AND Feature programs; export button.
  5. **New Program flow** (`NewProgramModal`, same file) — a **"+ New Program"** button (Programs tab only) opens a 3-step wizard, **every step mandatory** (can't advance until filled): **Details** (name + product both required; type Hardware|Feature; starting phase for hardware) → **Audience** (**required** — pick a live Qualtrics list with ≥1 tester; it auto-loads and becomes the program's `audienceSize`) → **First survey** (**required** — pick kind + title). On finish it creates the program **and** its first draft survey, then lands you on that survey (`onCreate(program, firstSurvey)`). *Rationale: an earlier version created the container only, but that left a confusing empty "Not started" program with nothing in the Surveys menu — so setup now always yields a working survey.* Adding more surveys later is still one-at-a-time via **"+ New survey"**. The imported list IS the program's audience: shown on the card ("Audience: N testers") and the default recipients for its surveys — **no separate "import testers" step anywhere**. The standalone **"Import from Qualtrics" tab was removed**. `PROGRAMS`/`SURVEYS` are page-level state.
  6. **Survey lifecycle model** — **Program → Phase → Surveys** is now first-class:
     - **A program is a long-lived container; it accumulates many surveys.** You do NOT create a new program per survey.
     - **Survey `kind`:** OOBE/Setup · Packaging/Unboxing · **"Weekly experience"** (label for the `performance` value — the experiential weekly pulse; renamed from "Performance" so it doesn't read as lab/benchmark throughput) · RTM testing (production-unit validation) · Re-setup (delete network, set up as new) · Final · Custom. **Recruiting is intentionally excluded** (handled in Qualtrics upstream, no data to chart). *(Enum values unchanged; only labels/emoji changed.)*
     - **Survey `cadence`:** recurring (weekly Performance) vs one-off. *(Waves/Week-N tracking deliberately deferred — "resuming after RTM" is just the recurring survey continuing.)*
     - **`phase` (hardware only):** EVT → DVT → PVT. Hardware reruns the whole survey cycle per phase; feature/software programs have no phase.
     - **`NewSurveyModal`** — a **"+ New Survey"** button (Surveys tab) and **"+ New survey"** per program card (Programs tab) launch **exactly one** survey INTO an existing program: pick program → (hardware) phase → kind → title → cadence. **Each survey is started individually when ready** — there is deliberately NO bulk "create the standard set" action (a tester never starts OOBE + Performance + RTM at once; that just clutters the list). Creating a survey in a later phase **advances the program's `currentPhase`** to it.
     - The **Surveys tab is grouped by program**, each card showing kind + cadence + phase tags; program group headers show the phases in play.
     - **Nav/IA:** three tabs — **Programs** (first + default landing; create/monitor programs, `+ New Program` lives here only), **Surveys** (`+ New Survey`), **Engagement**. The Import tab was removed.
     - **Program lifecycle actions** (Programs tab, per card): **`+ New survey`** (active programs only), **`✓ Close program` / `↩ Reopen`** (toggles `status` active↔completed — closing ends the beta but KEEPS it + its surveys on the record; non-destructive), and **`🗑 Delete program`** (destructive; cascades to delete the program's surveys; native `confirm()`). Surveys have **`🗑`** delete on each card and in the detail view.
     - **The app does NOT send surveys.** The real pipeline (and the demo's stated model): you build + send a survey in **Qualtrics** → as testers respond, that data is **collected and pushed to Insight** → results show here and roll up onto the **program card** (response rate, feedback quality). A newly-created survey opens `DraftPanel`, a plain "set up — waiting on responses" state (no charts, no send/distribute action — those were removed as misleading). Populated results only exist on seeded surveys that already carry response data.
     - **Duplicate guard (New Survey):** a double-submit lock (button → "Creating…") plus an amber warning when a same program+phase+kind survey already exists.
  7. **UX audit pass (2026-08-28)** — a multi-lens `ultracode` workflow (5 review lenses → adversarial verify) surfaced 10 confirmed confusion points. **Fixed:** (a) wizard no longer creates a survey [item 5]; (b) removed the redundant "↗ Author in Qualtrics" button from the Surveys header (two "start a survey" buttons); (c) "Performance"→"Weekly experience" relabel; (d) reworded undefined "People" → "existing testers by email"; (e) Import tab no longer defaults to a hardcoded program — forces an explicit pick, Import button disabled until list + program chosen; (f) **drafts now render a dedicated `DraftPanel`** instead of the zeroed results dashboard — a clean "not distributed yet, author it in Qualtrics" empty state with the draft's real metadata (program / type / cadence / audience) and a **"↗ Author in Qualtrics"** button (this is where the removed Surveys-header link relocated, now bound to the specific draft). No more all-zero charts or misleading "Synced from Qualtrics" tag on drafts. All 10 confirmed audit findings are now addressed.
  8. **EDS compliance pass (2026-08-28)** — the page now uses real EDS primitives instead of raw markup/emoji: **`Icon` + `ICONS`** everywhere (emoji dropped; decorative box/flask/flag emoji removed as text since EDS has no equivalent; `Button` uses `leftIcon`); the engagement table is **`TableV2`** (config-mode `columns` with hand-written defs); toasts use **`ToastProvider` + `useToast`** (page is a thin `ToastProvider` shell around `DemoSurveysInner`); the 94-survey picker stays **`Select` + `showSearch`** (EDS's blessed pattern per the component team). Colors tightened to a cohesive token set (`OK_GREEN`/`WARN_ORANGE`/`BAD_RED`/`ACCENT`; turquoise→periwinkle; cool choice-chart palette). Hand-built SVG charts remain (EDS ships no chart primitive — matches `OverviewDashboard`). Verified: tsc clean, `/demo-surveys` 200.
- **`src/app/api/demo-qualtrics-lists/route.ts`** — isolated demo API route. Calls the **current** XM Directory endpoint `GET /directories/{id}/mailinglists` (+ `/{listId}/contacts`) using existing env token. Seeded fallback if live call fails.

### Verified working
- Qualtrics survey list: live (94 real surveys).
- Qualtrics directory lists: **live** (`source: live`, real list names).
- Contacts for a real list: **live** (real member names/emails).
- `/demo-surveys` renders HTTP 200, no type errors.

### Notes / gotchas
- EDS `ProgressBar` **requires** a `className` or `colorBreakpoints` prop or it throws — remember when reusing.
- Directory list `contactCount` shows 0 (endpoint needs an extra flag to return counts; members still import fine).
- The import route reads **real tester PII** live — fine internally, mind before broad sharing.
- Legacy top-level `/mailinglists` API is deprecated (410) in this org; must use directory-scoped path.

---

## 5. How programs work TODAY (verified in code)

Two disconnected concepts (this is the fragmentation to resolve):
1. **Hardware programs** — NOT created explicitly. `ProgramsTab.tsx` loops a fixed 7-value enum (`beta, dogfood, prq, pvt, evt, dvt, other`) and groups devices by `device.program`. A program "exists" when a device is imported with that label. Product name comes from `device.product`.
2. **Dogfood offerings** — explicitly created via a "New Program" form in `ProgramSignupsTab.tsx` → `ProgramOffering` object (`addOffering` in `programsStore.ts`).

**Implication:** feature programs (no devices) can't exist in the current model → we MUST introduce a created program object for them.

---

## 6. Key code locations (real app)

- Types: `src/types/index.ts` — `Program` (string union, line ~7), `Person` (~116), `TesterProfile` (~432, ADD engagement/targeting fields here), `ProgramOffering`/`ProgramSignup` (~383).
- Stores: `src/store/{deviceStore,programsStore,packagesStore,authStore}.ts` (Zustand + persist to localStorage).
- Programs UI: `src/components/ProgramsTab.tsx` (device-label grouping), `src/components/ProgramSignupsTab.tsx` (offering create form).
- Qualtrics (real): `src/app/api/qualtrics/route.ts` (directory contacts, opt-out). Env: `QUALTRICS_BASE_URL`, `QUALTRICS_API_TOKEN`, `QUALTRICS_DIRECTORY_ID`.
- EDS usage reference: `src/components/OverviewDashboard.tsx` (Card, tokens, hand-built charts).
- EDS components available: Button, Card, Checkbox, Input, Layout, Modal, ProgressBar, Segmented, Select, Sidebar, Tabs, Tag, TextArea.

---

## 7. Open decisions (need answers to proceed)

1. **Unify programs or not?** Recommendation: **unify incrementally** — one "New Program" flow that creates a first-class Program object (extend the existing `ProgramOffering` pattern) with `type: Hardware | Feature`; keep device-label grouping working underneath so existing tabs don't break.
2. **Merge into the real app now, or keep iterating in the demo?**

---

## 8. Next step

~~Build a **"New Program" flow into the demo**~~ — **DONE (2026-08-28).** `NewProgramModal` in `demo-surveys/page.tsx`: New Program → name + product + type (Hardware/Feature) → optional Qualtrics list import as audience → optional first (draft) survey → created program/survey show up live across views. Type-checks clean; `/demo-surveys` renders 200.

Possible follow-ups within the demo (not yet done):
- Let the audience step feed the Engagement/At-Risk table (imported testers become `DemoTester`s), so the new program isn't empty there.
- Program Health card for a brand-new program shows "Not started" — fine, but a "Create survey" affordance on the card would tie the loop together from that view too.

The **big** next step (separate, explicit) — **merge into the real app**:
1. Promote inline demo types → `src/types/index.ts` (additive/optional fields only).
2. Move mock data → new `src/store/surveyStore.ts`.
3. Move views → `src/components/` + add a **Surveys tab** to `Navbar.tsx`.
4. Fold Qualtrics list import into the real `src/app/api/qualtrics/route.ts` (retire the demo route).
- Blast radius stays additive: `Program` string union, `device.program`, Devices/Shipments tabs all untouched.

---

## 9. How to run

- Dev server: `npm run dev` → http://localhost:3000/demo-surveys
- Reference app (read-only): `.reference/eero-beta-app-prod/` (source only; no node_modules/db).

---

## Device detail — where each field comes from (2026-08-31)

Clicking a serial in a program's device roster opens a device detail view (mirrors the real `DeviceDetailPanel`). In the demo it's deterministic mock; in production it's a **join of three sources**, keyed on the serial:

1. **Insight (live, looked up by serial → network)** — refetched, never stored:
   - Status (online/offline), Firmware current version, Firmware latest available, Network Health (speed Down/Up), Insight Network (id + link), Model, Manufacturer, MAC*, Admin/unit id*, Country/region*.
2. **Qualtrics roster** — authored:
   - Assigned To (tester name), Email (eero-account), Contact Email (corporate).
3. **Your feature's own records** — authored/logistics:
   - Revision, Revision Notes, Hardware Config, SKU, Part Number, Asset Tag, PO/Expensify, Tracking, Return Tracking, Notes, Due Date, Alternate Email. (Testbed = program name; Program = program type. JIRA = existing JIRA integration.)

`*` = not yet verified against the live API (scope-dependent).

**Decision (2026-08-31):** we do **not** currently track the logistics/inventory fields anywhere (there is no inventory source feeding them, and there is no CSV-into-Insight path). So for now those fields are **left open (blank "—")** in the detail view rather than populated with placeholder data. When needed, they'll be **entered/edited in-app** (the "Edit details" button becomes real) — there is no upstream system to import them from.

**Live vs authored:** Insight fields (status/firmware/speed/network) are always fetched fresh; roster + logistics fields are authored once and stored in the feature's own records.

---

## Serial ↔ tester assignment + shared device store (2026-08-30)

This session reworked the Programs device roster around the **serial-as-join-key** model and wired it into the real device store. Files touched: `src/components/SurveysDemo.tsx`, `src/components/DevicesTab.tsx`, `src/app/api/insight/route.ts` (new, prior session), plus link-path unification across `DeviceDetailPanel.tsx`, `PeopleTab.tsx`, `OptOutChecklistPanel.tsx`, `OptBackInChecklistPanel.tsx`.

### What changed

- **`ProgramDevicesView` rebuilt around assignment, not email-guessing.** Roster = the program's Qualtrics testers (`program.testers`). Per tester you **assign the serial(s) you shipped them** (comma/space-separate to add several at once). Each serial is enriched through **`/api/insight?serial=`** → resolves its **network + live status + model + firmware**. A tester can hold **many devices** (multi-device betas). **Pull mesh** takes one resolved serial's network and adds the other beta units on that mesh. Per-tester **Recheck** and header **Sync from Insight** re-hit the route. Device states: **online / not online / pending activation** (assigned but not yet on a network).
- **Insight/Admin deep links per device**, anchored on the resolved `networkId`.
- **Devices menu (`DevicesTab`)** already grouped devices into program containers with status; added the serial→Insight link + per-row Admin link.

### SIMULATION NOTE for engineering (important — flag before productionizing)

The Programs device roster now writes into the shared `deviceStore` (`useDeviceStore`) so assigned devices surface in **Devices / People / Locations** — this is the "one device, shown in every menu" shared model. **Two things are simulated and must change for production:**

1. **Seed re-sync on open.** `ProgramDevicesView` seeds a deterministic device set per tester (`seedAssignments`) so the demo isn't blank, and a mount `useEffect` upserts that seed into `deviceStore` (idempotent by serial). **In production there is no seed** — the device row is written **once, at real assignment time** (when the operator confirms the serial they shipped), not re-synced on every view open. Remove `seedAssignments` + the mount-sync effect when wiring to real data.
2. **`/api/insight` is on the deterministic seed fallback**, not live eero data. It flips to live automatically once `EERO_API_TOKEN` is set and the eero User API session is valid (`eero api user --prod auth --sso`, on VPN). The route's live REST paths/field names are still marked `TODO(verify)` and must be confirmed against the live API (search-by-email → networkId; network-eeros payload; by-serial shape). Until then, `enrichSerial` maps the seed shape.

Also note: `programEnumFor()` maps a demo program onto the real `Program` enum (dogfood by name; hardware by `currentPhase` DVT/EVT/PVT/PRQ; else `beta`). Serials are deterministic per tester email, so cross-program serial collisions are possible in the demo (harmless — `getDeviceBySerial` upserts). Real serials are unique.

### Link paths — CONFIRMED (2026-08-30)

Verified against the live tools: **both Insight and Admin key the network view on `/networks/{networkId}`.**
- Insight network: `https://insight.eero.com/networks/{networkId}`
- Admin network: `https://admin.e2ro.com/networks/{networkId}`

Unified the whole repo to `/networks/{id}` — replaced the older `insight.eero.com/eeros/{id}` pattern in `DeviceDetailPanel`, `PeopleTab`, `OptOutChecklistPanel`, `OptBackInChecklistPanel`, and `DevicesTab`. Person/unit **admin ID** links (`admin.e2ro.com/users/{adminId}`) were left as-is — those point at a user/unit record, a different resource than the network view, and were not part of the verification.

Verified: `npx tsc --noEmit` clean; `/`, `/demo-surveys`, `/api/insight` all HTTP 200.

---

## To make it live — the 5 remaining hookups (2026-08-30)

The front end is built and wired: every screen (Devices, Programs, People, Locations, Surveys, Engagement), all the count tiles, the Insight/Admin links, and the assign-serial flow already work and derive their numbers from one shared device store. They will show **real** totals with no rebuild. What's left is connecting to the real eero systems and confirming the handshake. In priority order:

1. **Get the eero sign-in working (blocker).** The live Insight connection currently fails at login, so the app runs on a deterministic practice fallback. Someone on the Amazon VPN needs to complete the eero User API SSO sign-in and provide a valid session token (`EERO_API_TOKEN`). Until then, no real device status can be pulled. Everything downstream is blocked on this.

2. **Confirm how Insight returns the data.** The serial lookup (`src/app/api/insight/route.ts`) uses our best-guess request paths and field names, marked `TODO(verify)`. Once signed in, confirm against the live API: serial → network resolution, the device fields (serial, model, firmware, online status), and the search-by-email fallback. Adjust the mapping if the real shape differs. (Link paths for the human-facing tools are already confirmed: both Insight and Admin use `/networks/{id}`.)

3. **Build a real "load the devices" path.** Today devices enter the app either from the practice seed or one-at-a-time via the assign flow. There is no bulk import of a real program's devices. Decide the real source (Insight network lookup, a fulfillment sheet, or provisioning capture) and build that ingestion so a program's full device list populates automatically.

4. **Clear out the practice data.** The seeded example devices/testers need to be removed (and the per-program seed-on-open behavior in the Programs device roster turned off — see the SIMULATION NOTE above) so real data isn't mixed with placeholders. In production the device record is written once, at real assignment time.

5. **Match people to their devices.** The tester names from the survey audience (Qualtrics) and the device owners in Insight aren't reconciled yet — they can be different names/emails. Decide the join key (serial is the reliable one; email is unreliable because a survey contact email often isn't the eero-account email) and wire it so a program's testers line up with their real devices.

**Summary:** screens + counting + links + assign flow = done and solid. Sign-in + data-shape confirmation + bulk ingestion + clearing practice data + people-matching = the remaining work, all gated on step 1.

---

## Insight-style UI pass on the Programs menu (2026-08-30, session 2)

Redesigned the Programs feature's three tabs to match the real Insight summary page (dense full-width rows, uniform small text, minimal chrome). All in `src/components/SurveysDemo.tsx` (+ one line in `src/app/page.tsx`).

- **Layout:** removed the centered `max-w-6xl` container — content now stretches the full content-area width, edge to edge (standalone `/demo-surveys` keeps its own padding; embedded relies on the app shell's). Removed the app shell's extra `mt-6` for this tab so the title sits tight under the top bar.
- **Programs tab:** program cards are compact full-width rows — name + type/phase tags on line 1; one metric line with equal-width columns spread across the card (Audience · Response rate · Devices online · Feedback · status tag right-aligned); thin-bordered action strip (text buttons). Status is now just **In progress / Completed** (healthy/needs-attention logic removed). Device counts derive live from the shared deviceStore. EDS `Pagination` at the bottom (5/10/25 per page).
- **Surveys tab:** removed the **Phase timeline** strip and its dead code (`PhaseTimeline`, `buildPhaseEvents`, `Sparkline`); removed the redundant "DVT · Running: …" sub-headers; group headers are plain text (program name + count, like Insight's "2 devices"); survey cards are one-line rows (title + muted kind·cadence·phase text · Questions · Latest wave · Responses · status + delete). Tag noise cut to just the status tag.
- **Engagement tab + device roster:** tightened card padding/gaps to match.
- Also removed: the lifecycle legend ("How it fits together"), per-tab description lines, page title shrunk to `text-base`.

Verified after each step: `tsc --noEmit` clean; `/` and `/demo-surveys` HTTP 200.

**Next session:** apply the same treatment (compact even-column rows, full width, small text, pagination) to the app-level **Devices / People / Locations** menus. Then the standing reminder: **the eero SSO login is still the blocker for live data** (see "To make it live", step 1).

---

## Live engagement via Qualtrics webhook (2026-08-30)

Engagement is now event-driven instead of simulated-only. When a tester submits a survey, Qualtrics fires a `completedResponse` webhook → we ingest it → the Engagement view overlays real metrics. No polling.

**Files**
- `src/lib/engagement.ts` — client seam: `LiveEngagement`/`EngagementFeed` types, `fetchLiveEngagement()`, and the `ENGAGEMENT_LIVE` flag (`NEXT_PUBLIC_ENGAGEMENT_SOURCE=qualtrics`).
- `src/lib/engagementStore.ts` — server ingestion store: `recordResponse()`, `computeEngagement()`, `setInvited()`. In-memory on `globalThis` for now; **production → DynamoDB** (same surface).
- `src/app/api/qualtrics/webhook/route.ts` — POST receiver for `completedResponse`. Optional shared-secret gate (`QUALTRICS_WEBHOOK_SECRET`, header `x-qualtrics-secret` or `?secret=`). Records the response; has a marked **re-summarize call point** (Bedrock) for when a new response lands.
- `src/app/api/engagement/route.ts` — GET, returns the computed per-tester feed.
- `SurveysDemo.tsx` `EngagementView` — overlays the live feed onto the roster by email when `ENGAGEMENT_LIVE`; else keeps simulated metrics (At-Risk + Tester Engagement both read the overlaid roster).

**Verified locally:** `POST /api/qualtrics/webhook` with a fake completedResponse → `GET /api/engagement` returns the tester's computed engagement (responses, reliability, avgResponseDays, feedbackQuality). tsc clean.

**To register the webhook (one-time per survey; needs a PUBLIC url — localhost can't receive callbacks):**
1. Deploy so `/api/qualtrics/webhook` is publicly reachable (or tunnel).
2. Create an event subscription: topic `completedResponse.{surveyId}`, publicationUrl `https://<host>/api/qualtrics/webhook`. (Qualtrics event-subscriptions API / the `create_webhook` tool.)
3. Set `QUALTRICS_WEBHOOK_SECRET` and include it on the subscription so only Qualtrics can post.
4. Set `NEXT_PUBLIC_ENGAGEMENT_SOURCE=qualtrics` to turn the overlay on.

**TODO(verify) when live:**
- The real `completedResponse` payload field names (SurveyID/ResponseID confirmed-ish; email + rating may need a follow-up fetch of the full response by ResponseID via the Qualtrics responses API).
- Invited counts per tester (from Qualtrics distributions or the program roster) so `reliability` + `missedSurveys` are real, not "all invited responded."
- Wire the Bedrock re-summarize at the marked call point.

---

## Bedrock AI summarizer + API production-readiness audit (2026-08-30)

### Bedrock summarizer (built)
Turns a survey's free-text responses into the structured `AISummary` the results view renders.
- `src/lib/summarize.ts` — shared types (`AISummary`/`Tone`/`Severity`/`Priority`), `SummarizeRequest`, `fetchSummary()`, `SUMMARIZE_LIVE` flag (`NEXT_PUBLIC_AI_SUMMARY=bedrock`). SurveysDemo imports these (inline copies removed).
- `src/lib/bedrock.ts` — `converseText()` (generic Bedrock Converse call, shared) + `summarizeWithBedrock()` (strict-JSON prompt → parse → normalize/validate). Env: `BEDROCK_MODEL_ID`, `BEDROCK_REGION`/`AWS_REGION`, AWS creds via default provider chain (task/instance role in prod).
- `src/app/api/summarize/route.ts` — Bedrock when `BEDROCK_MODEL_ID` set, else a computed fallback from the responses (so the UI always works). `@aws-sdk/client-bedrock-runtime` is already a dependency.
- `SurveysDemo` `AISummaryPanel` — now takes the `survey`, collects its text responses, and calls `/api/summarize` when `SUMMARIZE_LIVE` (or whenever there's no canned demo summary); canned demo summaries replay when the flag is off. Loading/error/retry states added.
- Webhook re-summarize point updated: summaries regenerate on demand via `/api/summarize`; a pre-warm/cache path (fetch full responses from Qualtrics) is left as `TODO(verify)`.
- **To go live:** set `BEDROCK_MODEL_ID` (+ region + AWS creds) and `NEXT_PUBLIC_AI_SUMMARY=bedrock`.

### API production-readiness audit
Every API adapter now has a real env-gated production path; none is mock-only except by fallback design.

| Route | Prod path | To activate |
|---|---|---|
| `/api/summarize` | Bedrock Converse | `BEDROCK_MODEL_ID` + AWS creds; `NEXT_PUBLIC_AI_SUMMARY=bedrock` |
| `/api/agent` | **Now Bedrock** (was local-only) → falls back to the local pattern-matching engine | same Bedrock env |
| `/api/qualtrics/webhook` + `/api/engagement` | webhook ingest → engagement feed | register `completedResponse.{surveyId}`; `QUALTRICS_WEBHOOK_SECRET`; `NEXT_PUBLIC_ENGAGEMENT_SOURCE=qualtrics` |
| `/api/insight` | eero User/Admin API by serial (+ seeded fallback) | `EERO_API_TOKEN` (+ eero SSO); confirm `TODO(verify)` paths |
| `/api/breadboard` | Breadboard inventory (+ seeded fallback) | `BREADBOARD_API_BASE` + Midway/SigV4; confirm endpoint shape |
| `/api/jira`, `/api/jira-webhook` | live JIRA REST + inbound webhook | `JIRA_BASE_URL`/`JIRA_USER_EMAIL`/`JIRA_API_TOKEN`/`JIRA_PROJECT_KEY`; register the webhook |
| `/api/databricks` | live SQL warehouse queries | `DATABRICKS_HOST`/`DATABRICKS_TOKEN`/`DATABRICKS_WAREHOUSE_ID` (+ table envs) |
| `/api/qualtrics`, `/api/demo-qualtrics-lists`, `/api/demo-qualtrics-surveys` | live Qualtrics (directory lists/contacts/surveys) + seeded fallback | `QUALTRICS_BASE_URL`/`QUALTRICS_API_TOKEN`/`QUALTRICS_DIRECTORY_ID` (already used live) |

Empty dirs `src/app/api/shapeshift` and `src/app/api/welcome-email` contain no routes (placeholders).

**Note:** activation everywhere is "set the env/creds" — no code changes. The only thing I can't do from here is provide the credentials/roles (Bedrock IAM, eero SSO, Midway, JIRA/Databricks tokens); those come from the live environment.

---
## Go-live readiness tooling + Qualtrics webhook registration (2026-08-30)
Everything below makes "is it ready?" provable and turns webhook go-live into one command.

### Readiness preflight — `GET /api/health`
Reports, per integration, whether the LIVE creds are present (booleans only, never secret values) and whether the client seam flag is flipped. `curl -s localhost:3000/api/health | jq`.
- `ready` = server creds present. `enabled` = `NEXT_PUBLIC_*` flag on the live source. A feature runs fully live only when **both** are true (rolled up under `liveFeatures`).
- Current `.env.local` (confirmed via this endpoint): **Qualtrics, JIRA, Databricks = ready**; Bedrock, Insight (`EERO_API_TOKEN`), Breadboard, and the webhook secret = not yet set.

### `.env.example`
Full env template, grouped by integration, with the flag+creds pattern documented for each. Copy to `.env.local` and fill in.

### Qualtrics webhook registration — `scripts/register-qualtrics-webhook.mjs`
The real registration wiring (Qualtrics event-subscription API). Loads `.env.local` itself so it works as a plain node script at deploy (Next.js env loading doesn't cover standalone scripts).
```
npm run webhook:register -- --list                                  # list current subscriptions
npm run webhook:register -- --survey SV_xxx --url https://<host>    # register completedResponse
npm run webhook:register -- --delete SUB_xxxxxxxx                   # remove one
```
- Topic: `surveyengine.completedResponse.{surveyId}`. Delivers to `https://<host>/api/qualtrics/webhook?secret=<QUALTRICS_WEBHOOK_SECRET>`.
- **Proven live:** `--list` was run against the real Qualtrics org and returned 0 subscriptions (auth + base-URL normalization + API call all work). The `--url` guard rejects http/localhost because Qualtrics (cloud) cannot deliver to a non-public URL.

### Receiver hardening
`/api/qualtrics/webhook` now recovers the fields the event envelope omits. A real `completedResponse` event carries `SurveyID`/`ResponseID`/`CompletedDate` but **not** the tester email or answers, so when those are absent the receiver fetches the full response by ID (`GET /surveys/{id}/responses/{id}`) and extracts the email from embedded data. Rating is pulled only when `QUALTRICS_RATING_QID` names the rating question (survey-specific) — no guessing. Enrichment is best-effort and never fails the webhook.

### What is genuinely left for LIVE engagement (not code)
1. **A public https URL** for `/api/qualtrics/webhook` — i.e. deploy the app (or a tunnel for testing). Qualtrics can't reach localhost. This is the real blocker.
2. **`QUALTRICS_WEBHOOK_SECRET`** — generate one, put it in `.env.local`, and it's auto-appended to the registration URL.
3. **Flip `NEXT_PUBLIC_ENGAGEMENT_SOURCE=qualtrics`**, then run `npm run webhook:register -- --survey SV_xxx --url https://<host>`.
For LIVE AI summaries, additionally set `BEDROCK_MODEL_ID` + region + AWS creds and `NEXT_PUBLIC_AI_SUMMARY=bedrock`. Verify all of it at once with `/api/health`.

---
## ⚠️ REMINDER: final webhook test AFTER the app is on a public URL (2026-08-30)
**Why this is still open:** locally we proved the hard half — when a `completedResponse`
alert arrives, the receiver calls the live Qualtrics single-response API, recovers the
real `recipientEmail` + timestamp, and updates that tester's engagement (verified against
the "[5GRG] Performance Survey"). What we could NOT test locally is the other half:
**Qualtrics reaching our app over the open internet.** Qualtrics is cloud-hosted and
cannot deliver to `localhost`, and this environment blocks public tunnels. That last hop
only becomes testable once the app is deployed to a public https address.

**Do this once the app is live on a public URL:**
1. Set env in the deployed environment: `QUALTRICS_WEBHOOK_SECRET`, `NEXT_PUBLIC_ENGAGEMENT_SOURCE=qualtrics`
   (and for AI summaries: `BEDROCK_MODEL_ID` + region + AWS creds, `NEXT_PUBLIC_AI_SUMMARY=bedrock`).
2. Confirm readiness: `curl -s https://<host>/api/health | jq` → the relevant `liveFeatures` should be `true`.
3. Register the webhook against a **real, contact-distributed** survey:
   `npm run webhook:register -- --survey SV_xxx --url https://<host>`
   (verify with `npm run webhook:register -- --list`).
4. Submit ONE real test response to that survey (or ask a tester to).
5. Confirm it flowed end to end: `curl -s https://<host>/api/engagement` shows that tester,
   with the correct submission time. This is the piece we haven't yet proven.
6. Clean up the test: `npm run webhook:register -- --delete SUB_xxx` if it was only for testing.

**Distribution requirement (learned during local testing):** email recovery only works when the
survey is sent to identified contacts (contact list / personal links) — which the beta performance
surveys already are. Anonymous-link surveys return no email; either add an `email` embedded-data
field or capture it as a question. Set `QUALTRICS_RATING_QID` to the rating question id if you want
the 1-5 feedback score pulled in too.

---
## Device online-status sync — cadence + production wiring (2026-08-31)
Uploaded devices start as `not_online` / `in_transit_to_tester`. Their real online
status comes from a Databricks sync, now triggered on two cadences:
- **On upload** — `ShipmentsTab` calls `runDatabricksSync(newSerials)` right after
  ingest, so freshly uploaded devices are checked immediately (best-effort; if
  Databricks isn't connected they simply stay "not online").
- **Weekly** — `isSyncStale()` is now 7 days (was 24h); when the dashboard opens
  and the last sync is >7d old, an auto-sync runs. This keeps API load low.

Shared logic lives in **`src/lib/networkSync.ts` → `runDatabricksSync(serials?)`**
(drives the store via `getState()`, so it's callable from the button, post-upload,
or a scheduler). The manual **Databricks Sync** button now calls the same helper.
Overlap is prevented by `syncMetadata.syncInProgress`; `isRateLimited()` guards
against hammering the API.

### To be production-ready
1. **Databricks credentials** on the `/api/databricks` route: `DATABRICKS_HOST`,
   `DATABRICKS_TOKEN`, `DATABRICKS_WAREHOUSE_ID`, `DATABRICKS_TESTER_TABLE`
   (+ optional `DATABRICKS_*_TABLE` overrides). Until set, sync returns "not
   connected" and devices stay `not_online`.
2. **A real server-side weekly scheduler.** The current weekly auto-sync is
   *client-triggered* — it only fires when someone opens the dashboard. For a
   guaranteed weekly run regardless of user activity, add a scheduled job
   (Vercel Cron / EventBridge+Lambda / cron) that calls the sync. That also
   implies **persisting device state server-side** (today it's client Zustand/
   localStorage), so the scheduled job has somewhere to write.
3. **Rate-limit / backoff** already gated client-side (`syncInProgress`,
   `isSyncStale`, `isRateLimited`); mirror the same guards in the scheduled job.

---
## Device sync is now Insight-native + source-pluggable (2026-08-31)
The online-status sync no longer requires Databricks. `src/lib/networkSync.ts`
now exposes `runDeviceSync(serials?)` + `checkSyncSource()`, choosing the source
via `DEVICE_SYNC_SOURCE` (from `NEXT_PUBLIC_DEVICE_SYNC_SOURCE`):
- **`insight`** (default) → `/api/insight` `POST {op:'sync', serials}`. Resolves each
  serial to live online status (+ network) via the eero User/Admin API, or a
  deterministic seeded fallback with no creds. Authoritative + real-time — the
  right source once embedded in Insight. Needs `EERO_API_TOKEN` (+ `EERO_USER_API_BASE`).
- **`databricks`** → `/api/databricks` (unchanged) for bulk warehouse sweeps.
Both adapters return the same `{ success, statuses, testers, onlineCount, notFound }`
shape, so the engine + apply logic is identical. The "Device Sync" card shows the
active source. Insight is per-serial (fine at hundreds on the weekly + on-upload
cadence); keep Databricks for very large one-shot sweeps if ever needed.

---
## Environment-aware deep-links — beta → prod, dogfood → stage (2026-08-30)
The whole point of this tool is one pane of glass across **both** tester cohorts,
each with a working jump into its network. Those cohorts live in **different eero
clouds**: beta testers in **production** Insight/Admin, dogfooders in **stage**.
So every Insight/Admin deep-link now routes to the correct environment.

**How env is decided** (`src/lib/format.ts` → `resolveEnv(environment?, program?)`):
1. Explicit `device.environment` (`'stage' | 'prod'`, stamped by shapeshift) wins.
2. Else inferred from cohort: `program` containing `dogfood` → **stage**, everything
   else (beta + the hardware phase codes) → **prod**.

**Hosts** (`format.ts`):
- **Prod (hardcoded, confirmed):** `insight.eero.com`, `admin.e2ro.com`.
- **Stage (env-driven, NOT guessed):** `NEXT_PUBLIC_INSIGHT_STAGE_URL`,
  `NEXT_PUBLIC_ADMIN_STAGE_URL`. Until the eero platform team confirms the stage
  hostnames and these are set, the helpers return `''` and every call site renders
  the id as **plain text** (with a "…not configured yet" tooltip) — never a broken link.
- `EeroEnv` type + each helper (`insightNetworkUrl`, `adminUserUrl`, `adminNetworkUrl`)
  takes an `env` arg defaulting to `'prod'` (backward-compatible).

**Wired through** (device-centric use the device's env; person-centric infer env
from the person's devices — any dogfood/stage device → stage):
- `DevicesTab` (serial→Insight + Admin), `DeviceDetailPanel` (Admin ID + Insight
  Network fields), `SurveysDemo` program roster, `PeopleTab` (profile + offboarding
  menu link), `OptOutChecklistPanel` / `OptBackInChecklistPanel` (offboarding a
  dogfooder touches a stage network — routing is correct there by design).
- Links carry the env in their tooltip (e.g. "Open in Insight (stage)") so with two
  windows open you always know which cloud you're about to hit.

**To activate stage links:** set `NEXT_PUBLIC_INSIGHT_STAGE_URL` +
`NEXT_PUBLIC_ADMIN_STAGE_URL` once platform confirms the hostnames. Zero code change.
Note: deep-links need **no credentials** (the human authenticates interactively in
each Insight); they're independent of the live-status sync creds below.

Verified: `tsc --noEmit` clean; `/`, `/demo-surveys`, `/api/health` all HTTP 200.

---
## Hosting decision — standalone (Harmony) vs embed in Insight (2026-08-30)
**Recommendation: ship standalone (Harmony), and manufacture the visibility that an
Insight embed would give for free.**

**Why not embed in production Insight:** prod Insight's data plane cannot see **stage**
networks/devices. Embedding there means dogfooders are either dropped, shown without
working links, or split into a second list in stage Insight. Since dogfooders are a
core cohort, that amputates half the tool's purpose. The "two windows" cost (prod vs
stage Insight are separate apps with separate auth) is **unavoidable in either option**
— so it isn't a reason to embed; embedding just *also* loses the stage data.

**Why standalone works:** the app makes its own server-side calls and owns its own
link generation, so it can hold **two credentials** (prod + stage) and route both data
and links per device. It's the only option that can be genuinely dual-environment.
Trade-off = less default discovery; buy it back with an **Insight launch tile/nav
entry into the tool** + socialization, and keep the door open to graduate into Insight
later (we're on EDS/WDS already, so promotion stays cheap).

**Key decoupling:** deep-links (navigation) need no creds and work cross-env today.
Live status **sync** needs one credential per env and degrades to seed without them.
So even if programmatic sync approval is slow, the cross-cohort directory + jump-off
ships immediately.

### Gating questions for the eero platform / Insight team (confirm before committing)
1. **Credentials (both envs):** sanctioned machine/service creds for the eero
   User/Insight API in **prod and stage**, scoped to read device→network→status.
   (Assume two separate env-scoped creds — confirm the request path.)
2. **Stage hostnames:** the stage equivalents of `api-user.e2ro.com` /
   `insight.eero.com` / `admin.e2ro.com` (drive them via the `NEXT_PUBLIC_*_STAGE`
   vars above — we won't guess).
3. **Harmony server-side posture:** can a Harmony-hosted tenant run server-side code
   that holds secrets and makes outbound calls to both eero API planes? If Harmony is
   static/content-only, where should a small Next.js service live instead?
