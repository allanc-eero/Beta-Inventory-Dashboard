import { allSeedDevices } from '@/data/seedData';
import { resolveEnv, EeroEnv } from '@/lib/format';

/**
 * HOST-AGNOSTIC SCHEDULED SWEEP
 *
 * Every run refreshes, for each device, its **online status, current firmware,
 * and network group** off the eero Admin API (one `GET /networks/{id}` per unique
 * network — the same call /api/insight already makes).
 *
 * Deliberately not tied to any host. The cadence is EXTERNAL: whatever is running
 * this deployment (a Harmony worker, an Insight job, a k8s CronJob, Vercel Cron,
 * or a plain `curl` in CI) just POSTs /api/sync on an interval. Two seams make it
 * portable:
 *   • SOURCE — where the list of devices to check comes from.
 *   • SINK   — where fresh results get written.
 * Swap adapters per host without touching the sweep. And `resolveBatch` is
 * injectable so an embedder can call the Admin resolver directly instead of over
 * HTTP.
 *
 * Scale: batches + paces the Admin API calls so ~1000 devices don't trigger rate
 * limits.
 */

export interface SweepTarget { serial: string; network?: string; env: EeroEnv }
export interface SyncResultRow { serial: string; online: boolean; firmware?: string; group?: string; network?: string; found: boolean }

export interface SweepSummary {
  ok: boolean;
  checked: number;
  online: number;
  withFirmware: number;
  withGroup: number;
  notFound: number;
  batches: number;
  durationMs: number;
  source: string;
  sink: string;
  warning?: string;
}

// ── SOURCE: where the device list comes from ──────────────────────────────────
export interface SyncSource { name: string; getTargets(): Promise<SweepTarget[]> }

// Default (dev/preview): the seeded beta fleet. In production this is swapped for
// the real inventory. TODO(verify): add the hosted source adapter — Insight's
// inventory API, a datastore, or Breadboard — and select it in getSyncSource().
const seedSource: SyncSource = {
  name: 'seed',
  async getTargets() {
    return allSeedDevices
      .filter((d) => d.serialNumber)
      .map((d) => ({ serial: d.serialNumber, network: d.network || undefined, env: resolveEnv(d.environment, d.program) }));
  },
};

export function getSyncSource(): SyncSource {
  return seedSource;
}

// ── SINK: where fresh results get written ─────────────────────────────────────
export interface SyncSink { name: string; apply(rows: SyncResultRow[]): Promise<void> }

// Default: log a summary. There is no server-side datastore in this prototype, so
// a HEADLESS sweep has nowhere to persist what the UI reads yet — the production
// sink writes to the datastore (the same persistence seam as the rest of go-live).
// TODO(verify): add the datastore-backed sink and select it in getSyncSink().
const logSink: SyncSink = {
  name: 'log',
  async apply(rows) {
    const online = rows.filter((r) => r.online).length;
    console.log(`[sweep] ${rows.length} devices checked, ${online} online — logSink (no persistence configured)`);
  },
};

export function getSyncSink(): SyncSink {
  return logSink;
}

// ── Batch resolver (injectable) ───────────────────────────────────────────────
// Default reuses the existing /api/insight POST so the Admin API logic isn't
// forked. An embedder (e.g. Insight) can inject a direct in-process resolver.
export type BatchResolver = (
  env: EeroEnv,
  items: { serial: string; network?: string }[],
) => Promise<{
  statuses: { serial: string; online: boolean }[];
  testers: { serial: string; network?: string; firmware?: string; group?: string }[];
  notFound: string[];
}>;

function httpResolver(origin: string): BatchResolver {
  return async (env, items) => {
    const res = await fetch(`${origin}/api/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'sync', env, items }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'insight sync failed');
    return { statuses: data.statuses || [], testers: data.testers || [], notFound: data.notFound || [] };
  };
}

const chunk = <T>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SweepOptions {
  origin?: string;              // base URL for the default (HTTP) resolver
  resolveBatch?: BatchResolver; // inject a direct resolver for embedded hosts
  source?: SyncSource;
  sink?: SyncSink;
  batchSize?: number;           // devices per Admin API sweep call (rate-limit pacing)
  pauseMs?: number;             // delay between batches
}

export async function runScheduledSweep(opts: SweepOptions = {}): Promise<SweepSummary> {
  const started = Date.now();
  const source = opts.source || getSyncSource();
  const sink = opts.sink || getSyncSink();
  const batchSize = opts.batchSize ?? 50;
  const pauseMs = opts.pauseMs ?? 250;
  const resolveBatch = opts.resolveBatch || httpResolver(opts.origin || '');

  const targets = await source.getTargets();
  const byEnv: Record<EeroEnv, SweepTarget[]> = { prod: [], stage: [] };
  targets.forEach((t) => byEnv[t.env].push(t));

  const rows: SyncResultRow[] = [];
  let batches = 0;
  let warning: string | undefined;

  for (const env of ['prod', 'stage'] as EeroEnv[]) {
    const groups = chunk(byEnv[env], batchSize);
    for (let i = 0; i < groups.length; i++) {
      try {
        const items = groups[i].map((t) => ({ serial: t.serial, network: t.network }));
        const { statuses, testers, notFound } = await resolveBatch(env, items);
        const onlineOf = new Map(statuses.map((s) => [s.serial.toUpperCase(), s.online]));
        const testerOf = new Map(testers.map((t) => [t.serial.toUpperCase(), t]));
        const nf = new Set(notFound.map((s) => s.toUpperCase()));
        groups[i].forEach((t) => {
          const key = t.serial.toUpperCase();
          const te = testerOf.get(key);
          rows.push({
            serial: t.serial,
            online: onlineOf.get(key) ?? false,
            firmware: te?.firmware,
            group: te?.group,
            network: te?.network ?? t.network,
            found: !nf.has(key),
          });
        });
      } catch (e: any) {
        warning = e?.message || 'a batch failed';
      }
      batches++;
      if (i < groups.length - 1 && pauseMs) await sleep(pauseMs);
    }
  }

  await sink.apply(rows);

  return {
    ok: true,
    checked: rows.length,
    online: rows.filter((r) => r.online).length,
    withFirmware: rows.filter((r) => r.firmware).length,
    withGroup: rows.filter((r) => r.group).length,
    notFound: rows.filter((r) => !r.found).length,
    batches,
    durationMs: Date.now() - started,
    source: source.name,
    sink: sink.name,
    warning,
  };
}
