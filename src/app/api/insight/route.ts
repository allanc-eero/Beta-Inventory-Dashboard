import { NextRequest, NextResponse } from 'next/server';

/**
 * SCAFFOLD route — resolve a tester's device(s) from Insight/eero by their
 * eero-account email. This is the serial-lookup chain we designed:
 *
 *   email  →  find the tester's eero network  →  list that network's eeros
 *          →  filter to the beta model (+ beta build)  →  the beta unit(s)
 *
 * Qualtrics never has serials; Insight owns them. So the ONLY input is the
 * eero-account email, and we READ the serials back from Insight.
 *
 * ── AUTH (not wired yet) ──────────────────────────────────────────────────────
 * The eero User API needs a session credential. Today the app has NO eero creds
 * (only Qualtrics/JIRA/Databricks). Until these env vars are set, this route
 * returns a deterministic seeded fallback so the UI works — same demo seam as
 * /api/demo-qualtrics-lists.
 *   EERO_USER_API_BASE   e.g. https://api-user.e2ro.com   (default below)
 *   EERO_API_TOKEN       the User API session/bearer token
 *
 * ── VERIFY WHEN LIVE ──────────────────────────────────────────────────────────
 * The exact REST paths + response shapes below are our best mapping of the eero
 * User API (search → network eeros) and are marked TODO(verify). Once the eero
 * session is refreshed (`eero api user auth --sso`), confirm:
 *   - search-by-email returns a resolvable networkId
 *   - the network-eeros payload field names (serial, model, os/firmware, status)
 *   - whether Insight tags beta networks into a "network group" (an even better
 *     discriminator than model+firmware)
 */

const EERO_USER_API_BASE = process.env.EERO_USER_API_BASE || 'https://api-user.e2ro.com';
const EERO_API_TOKEN = process.env.EERO_API_TOKEN;

type MatchState = 'matched' | 'multiple' | 'unmatched';

interface InsightEero {
  serial: string;
  model: string;
  firmware: string;
  online: boolean;
}

interface LookupResult {
  source: 'live' | 'seed';
  email: string;
  betaModel: string | null;
  match: MatchState;
  networkId: string | null;
  devices: InsightEero[];   // the beta-model unit(s) on this tester's network
  allEeros?: InsightEero[]; // everything on the network (pre-filter), for context
  warning?: string;
}

// ── Beta-unit filter ──────────────────────────────────────────────────────────
// Model is the primary discriminator (beta = a pre-release model codename).
// Firmware/build is the tiebreaker when a model also ships at retail.
function isBetaBuild(firmware: string): boolean {
  const f = (firmware || '').toLowerCase();
  return f.includes('beta') || f.includes('stage') || f.includes('dev') || f.includes('rc');
}

function filterBetaUnits(eeros: InsightEero[], betaModel: string | null): InsightEero[] {
  if (!betaModel) return eeros; // no model hint → caller decides (treat all as candidates)
  const model = betaModel.toLowerCase();
  const byModel = eeros.filter((e) => (e.model || '').toLowerCase().includes(model));
  // If several match the model, prefer those on a beta build; if that still
  // leaves several, they're all candidates (the "multiple" case → human picks).
  const betaBuild = byModel.filter((e) => isBetaBuild(e.firmware));
  return betaBuild.length > 0 && betaBuild.length < byModel.length ? betaBuild : byModel;
}

function matchState(devices: InsightEero[]): MatchState {
  if (devices.length === 0) return 'unmatched';
  if (devices.length === 1) return 'matched';
  return 'multiple';
}

// ── Live eero User API calls (paths TODO(verify) against the live API) ─────────
async function eeroFetch(path: string): Promise<any> {
  const res = await fetch(`${EERO_USER_API_BASE}${path}`, {
    headers: {
      // TODO(verify): confirm the exact auth scheme the User API expects.
      Authorization: `Bearer ${EERO_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`eero ${res.status} for ${path}`);
  return res.json();
}

async function resolveNetworkId(email: string): Promise<string | null> {
  // TODO(verify): /2.3/search?q=<email> — pull the tester's networkId from results.
  const data = await eeroFetch(`/2.3/search?q=${encodeURIComponent(email)}`);
  const networks = data?.data?.networks || data?.networks || [];
  const first = networks[0];
  if (!first) return null;
  const url: string = first.url || first.network || '';
  const id = first.id || url.split('/').filter(Boolean).pop();
  return id ? String(id) : null;
}

async function fetchNetworkEeros(networkId: string): Promise<InsightEero[]> {
  // TODO(verify): network-eeros path + payload field names.
  const data = await eeroFetch(`/2.2/networks/${networkId}/eeros`);
  const rows = data?.data || data?.eeros || [];
  return rows.map((e: any) => ({
    serial: e.serial || e.serial_number || '',
    model: e.model || e.model_number || '',
    firmware: e.os || e.os_version || e.firmware || '',
    online: (e.status || e.connectivity?.status) === 'green' || e.status === 'online' || e.connected === true,
  }));
}

// ── Serial-anchored lookup (the PREFERRED path) ────────────────────────────────
// You already know serial↔tester from your fulfillment sheet, so we don't guess
// by email — we resolve the serial directly and enrich it with live status.
interface SerialResult {
  source: 'live' | 'seed';
  serial: string;
  match: 'matched' | 'unmatched'; // matched = Insight knows this serial
  networkId: string | null;
  device: InsightEero | null;
  warning?: string;
}

async function fetchEeroBySerial(serial: string): Promise<{ eero: InsightEero; networkId: string | null } | null> {
  // TODO(verify): confirm the by-serial path/shape. Admin API has get-eero-by-serial;
  // the User API also resolves a serial. Field names mirror fetchNetworkEeros.
  const data = await eeroFetch(`/2.2/eeros/${encodeURIComponent(serial)}`);
  const e = data?.data || data;
  if (!e || !(e.serial || e.serial_number)) return null;
  const networkUrl: string = e.network?.url || e.network || '';
  const networkId = e.network?.id || (typeof networkUrl === 'string' ? networkUrl.split('/').filter(Boolean).pop() : null);
  return {
    eero: {
      serial: e.serial || e.serial_number,
      model: e.model || e.model_number || '',
      firmware: e.os || e.os_version || e.firmware || '',
      online: (e.status || e.connectivity?.status) === 'green' || e.status === 'online' || e.connected === true,
    },
    networkId: networkId ? String(networkId) : null,
  };
}

// ── Seeded fallback (deterministic per email) — mirrors the demo's match mix ───
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function seededLookup(email: string, betaModel: string | null): LookupResult {
  const seed = hashSeed(email);
  const model = betaModel || 'Merci';
  const mkSerial = (n: number) => `GGC54MX36114${(4000 + n).toString(36).toUpperCase().padStart(4, '0')}`;
  const r = seed % 10;

  if (r === 2 || r === 9) {
    // email never resolved to an eero account
    return { source: 'seed', email, betaModel, match: 'unmatched', networkId: null, devices: [] };
  }
  const networkId = String(17000000 + (seed % 99999));
  if (r === 5) {
    const devices: InsightEero[] = [
      { serial: mkSerial(seed % 900 + 1), model, firmware: 'v7.3-beta', online: true },
      { serial: mkSerial(seed % 900 + 2), model, firmware: 'v7.3-beta', online: seed % 2 === 0 },
    ];
    return { source: 'seed', email, betaModel, match: 'multiple', networkId, devices, allEeros: devices };
  }
  const beta: InsightEero = { serial: mkSerial(seed % 900 + 3), model, firmware: 'v7.3-beta', online: r !== 4 };
  const retail: InsightEero = { serial: mkSerial(seed % 900 + 50), model: 'eero 6+', firmware: 'v7.2', online: true };
  return { source: 'seed', email, betaModel, match: 'matched', networkId, devices: [beta], allEeros: [beta, retail] };
}

function seededSerialLookup(serial: string): SerialResult {
  const seed = hashSeed(serial);
  // Most known serials resolve; a few don't (never activated / RMA'd / mistyped).
  if (seed % 12 === 0) {
    return { source: 'seed', serial, match: 'unmatched', networkId: null, device: null };
  }
  const device: InsightEero = { serial, model: 'Merci', firmware: 'v7.3-beta', online: seed % 5 !== 0 };
  return { source: 'seed', serial, match: 'matched', networkId: String(17000000 + (seed % 99999)), device };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serial = searchParams.get('serial');
  const email = searchParams.get('email');
  const betaModel = searchParams.get('model'); // optional beta-model hint for the email filter

  // ── PREFERRED: serial-anchored. You know serial↔tester from your sheet; this
  //    just enriches that pairing with live Insight status (no email guessing). ──
  if (serial) {
    if (!EERO_API_TOKEN) return NextResponse.json(seededSerialLookup(serial));
    try {
      const found = await fetchEeroBySerial(serial);
      const r: SerialResult = found
        ? { source: 'live', serial, match: 'matched', networkId: found.networkId, device: found.eero }
        : { source: 'live', serial, match: 'unmatched', networkId: null, device: null };
      return NextResponse.json(r);
    } catch (err: any) {
      return NextResponse.json({ ...seededSerialLookup(serial), warning: err.message });
    }
  }

  // ── FALLBACK: email-anchored, for testers where you don't have a serial. ──
  if (!email) {
    return NextResponse.json({ error: 'serial or email is required' }, { status: 400 });
  }

  // No eero creds yet → deterministic seeded fallback so the UI still works.
  if (!EERO_API_TOKEN) {
    return NextResponse.json(seededLookup(email, betaModel));
  }

  try {
    const networkId = await resolveNetworkId(email);
    if (!networkId) {
      const r: LookupResult = { source: 'live', email, betaModel, match: 'unmatched', networkId: null, devices: [] };
      return NextResponse.json(r);
    }
    const allEeros = await fetchNetworkEeros(networkId);
    const devices = filterBetaUnits(allEeros, betaModel);
    const r: LookupResult = {
      source: 'live',
      email,
      betaModel,
      match: matchState(devices),
      networkId,
      devices,
      allEeros,
    };
    return NextResponse.json(r);
  } catch (err: any) {
    // On any live failure, fall back to seed so the demo never breaks.
    return NextResponse.json({ ...seededLookup(email, betaModel), warning: err.message });
  }
}
