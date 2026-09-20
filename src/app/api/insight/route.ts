import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve a tester's device(s) from the eero API by serial (preferred) or email.
 *
 *   email  →  find the tester's eero network  →  list that network's eeros
 *          →  filter to the beta model (+ beta build)  →  the beta unit(s)
 *   serial →  resolve directly + enrich with live status (the preferred path)
 *
 * ── DUAL-CLOUD (standalone) ────────────────────────────────────────────────────
 * eero Fetch is standalone and spans BOTH clouds:
 *   - BETA testers/devices live in PRODUCTION  → prod eero API
 *   - DOGFOOD testers/devices live in STAGE     → stage eero API
 * The caller passes the env (beta → 'prod', dogfood → 'stage'); each env has its
 * own base URL + token. Missing creds for an env → deterministic seeded fallback
 * for that env, so the UI always works.
 *
 *   EERO_USER_API_BASE_PROD   (default https://api-user.e2ro.com)
 *   EERO_API_TOKEN_PROD
 *   EERO_USER_API_BASE_STAGE  (TODO(platform): confirm stage host)
 *   EERO_API_TOKEN_STAGE
 * Back-compat: EERO_USER_API_BASE / EERO_API_TOKEN are read as the prod pair.
 *
 * ── VERIFY WHEN LIVE ──────────────────────────────────────────────────────────
 * The REST paths + response shapes below are our best mapping of the eero User API
 * and are marked TODO(verify). Once a session is available, confirm per env:
 *   - search-by-email returns a resolvable networkId
 *   - the network-eeros payload field names (serial, model, os/firmware, status)
 *   - the by-serial shape
 */

type Env = 'prod' | 'stage';

function envConfig(env: Env): { base: string; token: string | undefined } {
  if (env === 'stage') {
    return { base: process.env.EERO_USER_API_BASE_STAGE || '', token: process.env.EERO_API_TOKEN_STAGE };
  }
  return {
    base: process.env.EERO_USER_API_BASE_PROD || process.env.EERO_USER_API_BASE || 'https://api-user.e2ro.com',
    token: process.env.EERO_API_TOKEN_PROD || process.env.EERO_API_TOKEN,
  };
}

// A request is "live" for an env only when that env has both a base and a token.
function isLive(env: Env): boolean {
  const { base, token } = envConfig(env);
  return !!base && !!token;
}

function parseEnv(v: string | null | undefined): Env {
  return v === 'stage' ? 'stage' : 'prod';
}

type MatchState = 'matched' | 'multiple' | 'unmatched';

interface InsightEero {
  serial: string;
  model: string;
  firmware: string;
  online: boolean;
}

interface LookupResult {
  source: 'live' | 'seed';
  env: Env;
  email: string;
  betaModel: string | null;
  match: MatchState;
  networkId: string | null;
  devices: InsightEero[];   // the beta-model unit(s) on this tester's network
  allEeros?: InsightEero[]; // everything on the network (pre-filter), for context
  warning?: string;
}

// ── Beta-unit filter ──────────────────────────────────────────────────────────
function isBetaBuild(firmware: string): boolean {
  const f = (firmware || '').toLowerCase();
  return f.includes('beta') || f.includes('stage') || f.includes('dev') || f.includes('rc');
}

function filterBetaUnits(eeros: InsightEero[], betaModel: string | null): InsightEero[] {
  if (!betaModel) return eeros;
  const model = betaModel.toLowerCase();
  const byModel = eeros.filter((e) => (e.model || '').toLowerCase().includes(model));
  const betaBuild = byModel.filter((e) => isBetaBuild(e.firmware));
  return betaBuild.length > 0 && betaBuild.length < byModel.length ? betaBuild : byModel;
}

function matchState(devices: InsightEero[]): MatchState {
  if (devices.length === 0) return 'unmatched';
  if (devices.length === 1) return 'matched';
  return 'multiple';
}

// ── Live eero User API calls (paths TODO(verify); per-env base + token) ────────
async function eeroFetch(path: string, env: Env): Promise<any> {
  const { base, token } = envConfig(env);
  const res = await fetch(`${base}${path}`, {
    headers: {
      // TODO(verify): confirm the exact auth scheme the User API expects.
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`eero ${res.status} for ${path} (${env})`);
  return res.json();
}

async function resolveNetworkId(email: string, env: Env): Promise<string | null> {
  // TODO(verify): /2.3/search?q=<email> — pull the tester's networkId from results.
  const data = await eeroFetch(`/2.3/search?q=${encodeURIComponent(email)}`, env);
  const networks = data?.data?.networks || data?.networks || [];
  const first = networks[0];
  if (!first) return null;
  const url: string = first.url || first.network || '';
  const id = first.id || url.split('/').filter(Boolean).pop();
  return id ? String(id) : null;
}

async function fetchNetworkEeros(networkId: string, env: Env): Promise<InsightEero[]> {
  // TODO(verify): network-eeros path + payload field names.
  const data = await eeroFetch(`/2.2/networks/${networkId}/eeros`, env);
  const rows = data?.data || data?.eeros || [];
  return rows.map((e: any) => ({
    serial: e.serial || e.serial_number || '',
    model: e.model || e.model_number || '',
    firmware: e.os || e.os_version || e.firmware || '',
    online: (e.status || e.connectivity?.status) === 'green' || e.status === 'online' || e.connected === true,
  }));
}

// ── Serial-anchored lookup (the PREFERRED path) ────────────────────────────────
interface SerialResult {
  source: 'live' | 'seed';
  env: Env;
  serial: string;
  match: 'matched' | 'unmatched'; // matched = the eero API knows this serial
  networkId: string | null;
  device: InsightEero | null;
  warning?: string;
}

async function fetchEeroBySerial(serial: string, env: Env): Promise<{ eero: InsightEero; networkId: string | null } | null> {
  // TODO(verify): confirm the by-serial path/shape. Field names mirror fetchNetworkEeros.
  const data = await eeroFetch(`/2.2/eeros/${encodeURIComponent(serial)}`, env);
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

// ── Seeded fallback (deterministic per email/serial) — mirrors the demo mix ────
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function seededLookup(email: string, betaModel: string | null, env: Env): LookupResult {
  const seed = hashSeed(email);
  const model = betaModel || 'Merci';
  const mkSerial = (n: number) => `GGC54MX36114${(4000 + n).toString(36).toUpperCase().padStart(4, '0')}`;
  const r = seed % 10;

  if (r === 2 || r === 9) {
    return { source: 'seed', env, email, betaModel, match: 'unmatched', networkId: null, devices: [] };
  }
  const networkId = String(17000000 + (seed % 99999));
  if (r === 5) {
    const devices: InsightEero[] = [
      { serial: mkSerial(seed % 900 + 1), model, firmware: 'v7.3-beta', online: true },
      { serial: mkSerial(seed % 900 + 2), model, firmware: 'v7.3-beta', online: seed % 2 === 0 },
    ];
    return { source: 'seed', env, email, betaModel, match: 'multiple', networkId, devices, allEeros: devices };
  }
  const beta: InsightEero = { serial: mkSerial(seed % 900 + 3), model, firmware: 'v7.3-beta', online: r !== 4 };
  const retail: InsightEero = { serial: mkSerial(seed % 900 + 50), model: 'eero 6+', firmware: 'v7.2', online: true };
  return { source: 'seed', env, email, betaModel, match: 'matched', networkId, devices: [beta], allEeros: [beta, retail] };
}

function seededSerialLookup(serial: string, env: Env): SerialResult {
  const seed = hashSeed(serial);
  if (seed % 12 === 0) {
    return { source: 'seed', env, serial, match: 'unmatched', networkId: null, device: null };
  }
  const device: InsightEero = { serial, model: 'Merci', firmware: 'v7.3-beta', online: seed % 5 !== 0 };
  return { source: 'seed', env, serial, match: 'matched', networkId: String(17000000 + (seed % 99999)), device };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serial = searchParams.get('serial');
  const email = searchParams.get('email');
  const betaModel = searchParams.get('model'); // optional beta-model hint for the email filter
  const env = parseEnv(searchParams.get('env')); // beta → 'prod' (default), dogfood → 'stage'

  // ── Readiness probe (per env) for the sync connection badge ──────────────────
  if (searchParams.get('op') === 'status') {
    const prodLive = isLive('prod');
    const stageLive = isLive('stage');
    const parts: string[] = [];
    parts.push(`prod: ${prodLive ? 'eero API' : 'seeded'}`);
    parts.push(`stage: ${stageLive ? 'eero API' : envConfig('stage').base ? 'seeded (no token)' : 'not configured'}`);
    return NextResponse.json({
      ready: prodLive || stageLive,
      source: prodLive || stageLive ? 'live' : 'seed',
      identity: parts.join(' · '),
      envs: {
        prod: { ready: prodLive, configured: !!envConfig('prod').base },
        stage: { ready: stageLive, configured: !!envConfig('stage').base },
      },
    });
  }

  // ── PREFERRED: serial-anchored ────────────────────────────────────────────────
  if (serial) {
    if (!isLive(env)) return NextResponse.json(seededSerialLookup(serial, env));
    try {
      const found = await fetchEeroBySerial(serial, env);
      const r: SerialResult = found
        ? { source: 'live', env, serial, match: 'matched', networkId: found.networkId, device: found.eero }
        : { source: 'live', env, serial, match: 'unmatched', networkId: null, device: null };
      return NextResponse.json(r);
    } catch (err: any) {
      return NextResponse.json({ ...seededSerialLookup(serial, env), warning: err.message });
    }
  }

  // ── FALLBACK: email-anchored ──────────────────────────────────────────────────
  if (!email) {
    return NextResponse.json({ error: 'serial or email is required' }, { status: 400 });
  }

  if (!isLive(env)) {
    return NextResponse.json(seededLookup(email, betaModel, env));
  }

  try {
    const networkId = await resolveNetworkId(email, env);
    if (!networkId) {
      const r: LookupResult = { source: 'live', env, email, betaModel, match: 'unmatched', networkId: null, devices: [] };
      return NextResponse.json(r);
    }
    const allEeros = await fetchNetworkEeros(networkId, env);
    const devices = filterBetaUnits(allEeros, betaModel);
    const r: LookupResult = {
      source: 'live', env, email, betaModel, match: matchState(devices), networkId, devices, allEeros,
    };
    return NextResponse.json(r);
  } catch (err: any) {
    return NextResponse.json({ ...seededLookup(email, betaModel, env), warning: err.message });
  }
}

// ── Batch device sync ─────────────────────────────────────────────────────────
// POST { op:'sync', serials: [...], env?: 'prod'|'stage' } → the SAME shape
// /api/databricks returns, so the shared sync engine can point at either source.
// The caller sends one request per cohort/env (beta → prod, dogfood → stage).
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { op?: string; serials?: unknown[]; env?: string };
  if (body.op !== 'sync' || !Array.isArray(body.serials)) {
    return NextResponse.json({ success: false, error: 'expected { op: "sync", serials: [], env? }' }, { status: 400 });
  }

  const env = parseEnv(body.env);
  const serials = body.serials.map((s) => String(s)).filter(Boolean);
  const live = isLive(env);

  const resolve = async (serial: string): Promise<SerialResult> => {
    if (!live) return seededSerialLookup(serial, env);
    try {
      const found = await fetchEeroBySerial(serial, env);
      return found
        ? { source: 'live', env, serial, match: 'matched', networkId: found.networkId, device: found.eero }
        : { source: 'live', env, serial, match: 'unmatched', networkId: null, device: null };
    } catch {
      return seededSerialLookup(serial, env);
    }
  };

  const results = await Promise.all(serials.map(resolve));
  const statuses: { serial: string; online: boolean }[] = [];
  const testers: { serial: string; network: string }[] = [];
  const notFound: string[] = [];

  results.forEach((r) => {
    if (r.match === 'unmatched' || !r.device) {
      notFound.push(r.serial);
      statuses.push({ serial: r.serial, online: false });
      return;
    }
    statuses.push({ serial: r.serial, online: r.device.online });
    if (r.networkId) testers.push({ serial: r.serial, network: r.networkId });
  });

  return NextResponse.json({
    success: true,
    env,
    source: live ? 'live' : 'seed',
    statuses,
    testers,
    onlineCount: statuses.filter((s) => s.online).length,
    notFound,
  });
}
