# Shapeshift Runbook

How shapeshifting works from the eero Fetch platform, and how to keep it reliably
"green" (ready to run).

## What it does

The Shapeshift tab moves an eero (or a whole network) between the **prod** and
**stage** environments by driving the real `eero shapeshift` CLI command. The
move includes an OTA to a cross-environment ("permissive-shift") firmware, a
reboot, and a heartbeat wait — so each run takes several minutes.

## How the platform runs it

- The Shapeshift tab POSTs to `/api/shapeshift`, which launches a background job.
- That job runs the CLI through `scripts/shapeshift_pty.py`, a pseudo-terminal
  wrapper that auto-answers the CLI's interactive confirmation prompt (the CLI
  refuses piped input — it needs a real TTY).
- The tab polls the job and streams live CLI output into the expandable job view.

## The status banner (green vs. yellow)

The banner reflects whether shapeshift can actually run:

- **Green** = CLI present + prod admin token valid → Run enabled.
- **Yellow** = CLI missing OR admin token missing/expired → Run disabled.

The banner **auto-refreshes every 30 seconds and on window focus**, and there's a
**↻ Re-check** button to refresh on demand. So a stale yellow banner heals itself
once auth is valid — no full page reload needed.

## Why it can go yellow: token expiry

Today the admin token is obtained from your **browser cookies** (session-based),
so it lapses over time. When it does, the banner turns yellow and tells you which
command to run.

### Re-authenticate (the quick fix)

On the server/machine running Fetch:

```
eero api admin --prod auth     # prod token (required for shapeshift)
eero api admin auth            # stage token
```

When prompted "Check for token in browser cookies? [y/n]", make sure you're
logged into the matching admin panel in your browser first:
- prod → https://admin.e2ro.com
- stage → https://admin.stage.e2ro.com

Then click **↻ Re-check** in the banner (or just wait ~30s). It turns green.

## The permanent fix: a bot/service admin token (team action)

Browser-cookie auth will always eventually expire. To make the banner stay green
indefinitely, provision a **bot/service admin account** and authenticate the CLI
with it. The CLI's password login is explicitly for bot accounts:

```
eero api admin --prod auth --username <bot-account>
```

This requires an admin to create the bot account — it can't be done from the
platform. Once a bot token is in place, the session-expiry problem goes away and
shapeshift stays ready without periodic re-auth.

> Note: We deliberately do NOT fake the banner green. It honestly reflects whether
> a shapeshift can run, so an operator is never surprised by a hang/failure on a
> live device. Keep the underlying auth valid rather than masking the indicator.

## Operating notes

- **Don't double-run the same unit.** Let a device finish its move before running
  it again, or use a different device.
- **In-memory jobs.** Job status lives in server memory; a dev-server restart
  loses the UI job state, though the actual move continues on eero's side. A
  database would fix this for production.
- **It's slow on purpose.** OTA + reboot + heartbeat = several minutes. The
  "Running…" state is normal — expand the job to watch live CLI output.
