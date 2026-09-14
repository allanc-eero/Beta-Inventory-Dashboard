import { Device } from '@/types';

/**
 * Inventory client for the dogfooder portal — the seam between the portal and
 * Breadboard's device-management system.
 *
 * Endgame: the portal is hosted in Breadboard (Harmony, Midway auth) and shows
 * a dogfooder their own devices + announcements, read from Breadboard's
 * inventory. Locally / in the demo, the portal keeps reading the seed store, so
 * this abstraction lets the data source swap without touching the portal UI.
 */

// An announcement shown in the portal (firmware news, survey nudges, actions).
export interface DogfoodAnnouncement {
  id: string;
  title: string;
  body: string;
  date: string; // ISO date
  level: 'info' | 'action' | 'warning';
}

export interface DogfoodInventoryResponse {
  source: 'live' | 'seed';
  login: string;
  devices: Device[];                 // the signed-in dogfooder's own devices
  announcements: DogfoodAnnouncement[];
  warning?: string;
}

// Flip on in the live eero environment to read devices from Breadboard instead
// of the local seed store. Off by default so the demo/preview keeps working.
export const BREADBOARD_ENABLED = process.env.NEXT_PUBLIC_INVENTORY_SOURCE === 'breadboard';

// Fetch the signed-in dogfooder's devices + announcements via the /api/breadboard
// adapter. In production the identity comes from the Midway session server-side;
// the `login` argument is a convenience for local/preview use.
export async function fetchDogfoodInventory(login: string): Promise<DogfoodInventoryResponse> {
  const res = await fetch(`/api/breadboard?login=${encodeURIComponent(login)}`);
  if (!res.ok) throw new Error(`inventory ${res.status}`);
  return res.json();
}

// ── Write path ────────────────────────────────────────────────────────────────
// Dogfooder-initiated actions the portal needs to push back to inventory. Today
// these go through /api/breadboard (acknowledged locally); in Breadboard they
// forward to its inventory write API. The portal keeps doing its local store
// mutation for the demo — these are the production seam to route through once live.
export interface OptOutRequest {
  login: string;
  reason: string;
  notes?: string;
  deviceSerials: string[];
}

export interface ReturnRequest {
  login: string;
  serial: string;
  trackingNumber?: string;
}

export interface WriteResult {
  ok: boolean;
  source: 'live' | 'seed';
  action: string;
  warning?: string;
}

async function postAction(action: string, payload: Record<string, unknown>): Promise<WriteResult> {
  const res = await fetch('/api/breadboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`${action} ${res.status}`);
  return res.json();
}

// Record a dogfooder opting out of a program (offboarding).
export function submitOptOut(req: OptOutRequest): Promise<WriteResult> {
  return postAction('opt_out', req as unknown as Record<string, unknown>);
}

// Record a dogfooder initiating a device return.
export function submitReturn(req: ReturnRequest): Promise<WriteResult> {
  return postAction('return', req as unknown as Record<string, unknown>);
}
