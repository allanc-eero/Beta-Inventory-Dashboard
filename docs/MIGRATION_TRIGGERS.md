# Migration Triggers — When to Upgrade

Check this list periodically. When any of these become true, it's time to start the database/auth migration.

## Trigger Checklist

- [ ] **Multiple users need access** — A second person asks to use the dashboard (localStorage is per-browser, they can't see your data)
- [ ] **1000+ devices** — Performance will degrade with localStorage at this scale
- [ ] **Real JIRA integration needed** — You want tickets auto-created in actual JIRA (requires server-side API keys)
- [ ] **Testers asking for self-service** — You're spending time answering "what's my device status?" emails
- [ ] **Leadership wants reports** — You're manually counting devices for status updates
- [ ] **Managing 3+ programs simultaneously** — The flat model starts feeling messy
- [ ] **Data loss concern** — Someone clears their browser cache and loses everything

## What to Do When Triggered

1. Come back to this doc
2. Reference `docs/TODO.md` items #1 (Auth), #4 (RBAC), and #7 (CMDB Architecture)
3. The migration path is documented there — Phase 1 → 2 → 3 → 4

## Quick Health Check (run monthly)

Ask yourself:
- How many devices are in the system? (if >800, start planning)
- Is anyone else asking to use this tool? (if yes, need shared backend)
- Am I manually doing things the tool should automate? (if yes, build it)
- Has anyone lost data? (if yes, urgent — move to database immediately)
