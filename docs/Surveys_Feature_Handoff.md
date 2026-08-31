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

Mine features from a separate production app (`eero-beta-app-prod`, now cloned read-only at `.reference/eero-beta-app-prod`) and rebuild the valuable ones into **eero Fetch** (this app) — WITHOUT copying code. Everything must be:
- **Functional but explicitly understandable, so someone can demo it** (mock/seed data + visible "simulated" seams).
- **Insight-ready** — the end goal is to land this as a feature inside **eero Insight**, so device/network telemetry can be joined from Insight later. Built with EDS components + tokens + Insight page patterns so the eventual port is a config swap, not a rewrite.

**No database.** Stays localStorage/Zustand like the rest of eero Fetch. Backend-dependent features are simulated behind the same `setTimeout` seam the app already uses.

---

## 2. The two apps (context)

- **eero Fetch (this app)** — device/hardware logistics. Next.js 14 App Router, Zustand + localStorage, EDS (`@amzn/eero-web-design-*`). Already has server-side API routes (`src/app/api/*`) calling real JIRA, Qualtrics, Databricks. Uses hand-built SVG charts (only d3 present, no recharts).
- **eero-beta-app-prod (reference only)** — engagement platform (surveys, cohorts, badges, discussions, AI summaries). Express + PostgreSQL + JWT. **Key finding: it already abandoned its homegrown survey builder and moved to Qualtrics** (migration 027 says the native survey tables are deprecated). So we do NOT rebuild a survey engine — we lean on Qualtrics.

---

## 3. Decisions locked

1. **Flagship = Surveys (Qualtrics-backed).** One feature done well. Second = Engagement view. Third = AI response summary.
2. **AI summary = survey feedback summary only** (themes/sentiment/issues/requests/actions). Rules engine computes facts; AI only narrates language. Not an engagement summary.
3. **Surveys come from Qualtrics, NOT Insight.** Insight is the eventual *home* (supplies device/network telemetry for the join), not the survey data source.
4. **Data-model merge:** don't import their `beta_testers` table — eero Fetch already has People/`TesterProfile`. Only add ~5 fields to `TesterProfile`: `reliability`, `avgResponseDays`, `feedbackQuality` (engagement), `technicalLevel`, `industryKnowledge` (targeting). Engagement scores are *derived from survey activity* and must show how they're computed.
5. **Cohort = a Program's testers.** Do NOT add a separate "cohort" concept. A survey targets a Program (or a saved segment). Keeps it one app.
6. **Feature testing:** programs have a **type: Hardware | Feature**. Feature programs ship no devices — participation + surveys are the whole interaction. Surveys span both types.
7. **Join key = email** (optionally a stable `testerId` as Qualtrics embedded data). Qualtrics responses/contacts join back to People by email.
8. **Say NO to** badges and discussions (vitamin, not painkiller; no tester-facing surface here).
9. **Robustness additions worth building (ranked):** (a) **At-Risk view** — intersection of device-offline + survey-unresponsive + low reliability (the reason to merge into Insight); (b) **closed loop** — survey response → JIRA ticket; (c) **program-health report** for leadership.

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
