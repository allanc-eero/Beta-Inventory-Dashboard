# eero Fetch — Harmony Launch Plan

**Status:** Draft for review
**Owner:** _(add name)_
**What this is:** the plan to take eero Fetch from a working prototype to a hosted
internal product on Harmony.

---

## What eero Fetch is
A unified place to see who has what device in what program — tester identity
joined with live network state from Insight (model, firmware, node count,
config) — so lookups and troubleshooting happen in one spot instead of across
spreadsheets and tools.

## Where we are today (honest status)
The **UI and feature set are ~90% built** and running as a prototype. "Launching
on Harmony" is a separate ~40–50% of the work: the production plumbing.

| Area | Prototype today | Needed for launch |
| --- | --- | --- |
| Auth | @eero.com dev login + roster | Real Midway / OIDC on Harmony |
| Data | Seeded / simulated | Live Insight + Admin API (prod + stage), real request shapes |
| Persistence | Client-side / local state | Shared server-side datastore (one source of truth) |
| Platform | Runs locally | Harmony tenant, pipelines, deploy config |
| Security | Prototype | AppSec/PII review, secrets, data classification |

The remaining time is dominated by this plumbing, plus platform onboarding and
review lead times — which is normal for a prototype → product jump.

---

## Timeline at a glance (~8–10 weeks to GA)
Assumes a small team (1–2 engineers) plus the Harmony/platform partners.
"Week 0" = kickoff; weeks are relative, not calendar dates.

| Phase | Weeks | Focus |
| --- | --- | --- |
| 0. Alignment & access | 0–1 | Confirm Harmony hosting, provision tenant, request API tokens, confirm auth model, open security intake |
| 1. Real auth | 1–2 | Midway/OIDC; replace dev login; roster = authorization |
| 2. Live data | 2–4 | Wire Insight/Admin API with real tokens; confirm shapes; dual-cloud; live sync + caching |
| 3. Shared persistence | 3–5 | Move to a real datastore; import data cleanly (no PII leakage) |
| 4. Integrations + hardening | 4–6 | Real Jira/Qualtrics creds; remove demo routes; logging/observability |
| 5. Security & compliance | 5–7 | AppSec review, PII handling, secrets, data classification |
| 6. Deploy + internal pilot | 6–8 | Harmony pipelines, staging, pilot with the beta team, fix feedback |
| 7. GA | 8–9 | Cutover, docs/onboarding, monitoring/alerts |

---

## Phase detail

**Phase 0 — Alignment & access (Week 0–1) · start immediately**
Confirm Harmony hosting with the platform team, kick off tenant/app provisioning,
request Admin API tokens (prod + stage), confirm the Midway auth model, and open
the security/CAZ intake. *These are long-lead dependencies and gate everything.*

**Phase 1 — Real auth (Week 1–2)**
Integrate Midway-at-edge (or app-level OIDC), replace the dev login, keep the
roster as the authorization layer.

**Phase 2 — Live data (Week 2–4)**
Wire the Insight/Admin API with real tokens, confirm request/response shapes
against a real session, finish dual-cloud (beta → prod, dogfood → stage), and
replace seed data with live sync + caching/rate-limit handling. *This is what
makes the core "who has what device" view real.*

**Phase 3 — Shared persistence (Week 3–5, overlaps Phase 2)**
Move from local/client state to a real datastore so the whole team sees one
source of truth; import existing data cleanly.

**Phase 4 — Integrations + hardening (Week 4–6)**
Real credentials for Jira / Qualtrics / etc., remove leftover demo routes, add
logging, observability, and error handling.

**Phase 5 — Security & compliance review (Week 5–7, partly parallel)**
AppSec review, PII handling, secrets management, data classification. *Book early
— review queues often have a fixed lead time.*

**Phase 6 — Deploy + internal pilot (Week 6–8)**
Harmony pipelines, staging deploy, a pilot with the beta team on real data, and a
fast feedback/fix loop.

**Phase 7 — GA (Week 8–9)**
Cutover, docs and onboarding, monitoring and alerting.

---

## Two tracks (pick the ambition level)

- **Pilot-first (~4–5 weeks):** launch on Harmony read-only against seeded or
  periodic-sync data, with real auth. Defers full live data + shared persistence.
  Fastest way to get it in front of the team on the platform.
- **Full GA (~8–10 weeks):** everything above — live data, shared persistence,
  full review. The real product.

## Critical path & risks
- **Critical path = Phase 0.** API token access, Harmony provisioning, and the
  security review queue are external lead times. They can compress this to ~8
  weeks or stretch it past 12 — firming them up early is the single biggest
  schedule lever.
- **Biggest engineering lift = live data + shared persistence (Phases 2–3).**
  Descoping these for a pilot is the main way to go faster.

## Open dependencies (asks of partner teams)
- **Platform/Harmony:** tenant/app provisioning, deploy pipeline, confirmed auth
  model (Midway-at-edge vs app OIDC), and typical onboarding lead time.
- **Insight/API owners:** Admin API tokens (prod + stage) and confirmation of the
  request/response shapes.
- **Security:** intake slot + expected review turnaround.
