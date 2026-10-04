import { NextRequest, NextResponse } from 'next/server';
import { runScheduledSweep } from '@/lib/server/sweep';

/**
 * SCHEDULED SWEEP TRIGGER — the host-agnostic entry point.
 *
 * The cadence lives OUTSIDE the app. Whatever hosts this (a Harmony worker, an
 * Insight job, a k8s CronJob, Vercel Cron, or a curl in CI) POSTs here on an
 * interval; each run refreshes online + firmware + group for the fleet.
 *
 * Recommended cadence at ~1000 devices: every ~4–6 hours for the full sweep,
 * plus the on-demand "Sync" button and a live refresh when viewing one device.
 *
 * Auth: a shared secret in `x-sync-secret` (matched against SYNC_SECRET). With no
 * secret configured it's allowed in non-production (dev/preview) and refused in
 * production, so a live deploy is never left open.
 */
const isProd = process.env.NODE_ENV === 'production';
const SYNC_SECRET = process.env.SYNC_SECRET;

function authorized(request: NextRequest): boolean {
  if (SYNC_SECRET) return request.headers.get('x-sync-secret') === SYNC_SECRET;
  return !isProd;
}

export async function GET() {
  return NextResponse.json({
    trigger: 'external-scheduler',
    configured: !!SYNC_SECRET,
    recommendedIntervalHours: 4,
    refreshes: ['online', 'firmware', 'group'],
    note: 'POST here on an interval (with x-sync-secret) to run a full sweep.',
  });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      { ok: false, error: SYNC_SECRET ? 'invalid or missing x-sync-secret' : 'SYNC_SECRET not configured (required in production)' },
      { status: 401 },
    );
  }
  try {
    const origin = new URL(request.url).origin;
    const summary = await runScheduledSweep({ origin });
    return NextResponse.json(summary);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'sweep failed' }, { status: 500 });
  }
}
