import { NextRequest, NextResponse } from 'next/server';
import { allSeedDevices } from '@/data/seedData';
import { Device } from '@/types';
import type { DogfoodAnnouncement } from '@/lib/dogfoodInventory';

/**
 * DOGFOODER INVENTORY ADAPTER — the seam between the dogfooder portal and
 * Breadboard's device-management system.
 *
 * Endgame: the portal is hosted in Breadboard (Harmony, Midway auth). This route
 * proxies Breadboard's inventory so the portal shows a dogfooder's real devices
 * + announcements. Until BREADBOARD_API_BASE is configured it returns a
 * deterministic seeded fallback (the same demo devices, filtered to the caller),
 * so the portal works locally — same pattern as /api/insight.
 *
 * ── TODO(verify) when wiring live ─────────────────────────────────────────────
 *  - BREADBOARD_API_BASE + the real inventory endpoint path + response shape.
 *  - Auth: service-to-service via Midway session / SigV4 — NOT the ?login param.
 *  - Identity: derive the dogfooder from the Midway session server-side; the
 *    ?login query param here is only a local/preview convenience.
 *  - Map Breadboard's device record onto our Device shape.
 */

const BREADBOARD_API_BASE = process.env.BREADBOARD_API_BASE;

const SEED_ANNOUNCEMENTS: DogfoodAnnouncement[] = [
  { id: 'a1', title: 'Firmware v7.3-beta rolling out', body: 'Your beta units update automatically over the next 48 hours — no action needed.', date: '2026-08-28', level: 'info' },
  { id: 'a2', title: 'Weekly experience survey is live', body: 'Tell us how this week went — it takes about 3 minutes.', date: '2026-08-26', level: 'action' },
];

// Fallback: a dogfooder's devices are those assigned to their login (account or
// contact email), from the same seed the demo store uses.
function seededInventory(login: string) {
  const e = login.toLowerCase().trim();
  const devices: Device[] = allSeedDevices.filter(
    (d) => d.assignedEmail?.toLowerCase() === e || d.contactEmail?.toLowerCase() === e,
  );
  return { source: 'seed' as const, login, devices, announcements: SEED_ANNOUNCEMENTS };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const login = (searchParams.get('login') || '').trim();
  if (!login) return NextResponse.json({ error: 'login is required' }, { status: 400 });

  // No Breadboard endpoint yet → seeded fallback so the portal still works.
  if (!BREADBOARD_API_BASE) {
    return NextResponse.json(seededInventory(login));
  }

  try {
    // TODO(verify): real Breadboard inventory call — path, response shape, and
    // Midway/SigV4 auth headers.
    const res = await fetch(`${BREADBOARD_API_BASE}/inventory/devices?owner=${encodeURIComponent(login)}`, {
      headers: { 'Content-Type': 'application/json' /* TODO(verify): Midway/SigV4 auth */ },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`breadboard ${res.status}`);
    const data = await res.json();
    // TODO(verify): map Breadboard's device shape → our Device shape.
    return NextResponse.json({
      source: 'live',
      login,
      devices: (data.devices ?? []) as Device[],
      announcements: (data.announcements ?? SEED_ANNOUNCEMENTS) as DogfoodAnnouncement[],
    });
  } catch (err: any) {
    // On any live failure, fall back to seed so the portal never breaks.
    return NextResponse.json({ ...seededInventory(login), warning: err.message });
  }
}

// ── Write path (dogfooder-initiated actions: opt-out, return) ──────────────────
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const action = String((body as any).action || '');
  if (!action) return NextResponse.json({ ok: false, error: 'action is required' }, { status: 400 });

  // No Breadboard endpoint yet → acknowledge. The portal still performs its local
  // store mutation for the demo; this seam is what routes to Breadboard once live.
  if (!BREADBOARD_API_BASE) {
    return NextResponse.json({ ok: true, source: 'seed', action });
  }

  try {
    // TODO(verify): map action → Breadboard's inventory write endpoint + Midway/SigV4 auth.
    const res = await fetch(`${BREADBOARD_API_BASE}/inventory/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' /* TODO(verify): Midway/SigV4 auth */ },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`breadboard ${res.status}`);
    return NextResponse.json({ ok: true, source: 'live', action });
  } catch (err: any) {
    return NextResponse.json({ ok: false, source: 'seed', action, warning: err.message });
  }
}
