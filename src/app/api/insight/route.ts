import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve a tester's device(s) online status + network from the eero API.
 *
 * ── DUAL-CLOUD (standalone) ────────────────────────────────────────────────────
 * eero Fetch spans BOTH clouds:
 *   BETA testers/devices    → PRODUCTION eero API
 *   DOGFOOD testers/devices → STAGE eero API
 * The caller passes env (beta → 'prod', dogfood → 'stage'). Missing creds for an env
 * → deterministic seeded fallback for that env, so the UI always works.
 *
 * ── VERIFIED LIVE (2026-09-02) ─────────────────────────────────────────────────
 * Global serial→device resolution is an ADMIN API capability (the User API is
 * account-scoped). Confirmed shapes:
 *   GET {admin}/eeros/serial/{serial}  → data.network.url (→ networkId), data.model, ...
 *   GET {admin}/networks/{networkId}   → data.nodes[] each { serial, status, firmware, ... }
 *                                        status === 'green' means online.
 * Response envelope everywhere: { meta, data }.
 *
 * Efficiency (option B): we DON'T do 2 calls per serial. We only by-serial the ones
 * whose network we don't already know, then fetch each UNIQUE network once and read
 * nodes[] (serial + status + firmware for every eero on it).
 *
 *   Admin API:  EERO_ADMIN_API_BASE_PROD/STAGE + EERO_ADMIN_API_TOKEN_PROD/STAGE
 *   User API (email→network fallback only): EERO_USER_API_BASE_PROD/STAGE + EERO_API_TOKEN_PROD/STAGE
 */

type Env = 'prod' | 'stage';

function parseEnv(v: string | null | undefined): Env {
  return v === 'stage' ? 'stage' : 'prod';
}

// Admin API — primary path (global by-serial + network listing).
function adminConfig(env: Env): { base: string; token: string | undefined } {
  if (env === 'stage') {
    return { base: process.env.EERO_ADMIN_API_BASE_STAGE || 'https://api-admin.stage.e2ro.com', token: process.env.EERO_ADMIN_API_TOKEN_STAGE };
  }
  return { base: process.env.EERO_ADMIN_API_BASE_PROD || 'https://api-admin.e2ro.com', token: process.env.EERO_ADMIN_API_TOKEN_PROD };
}
function adminLive(env: Env): boolean {
  const { base, token } = adminConfig(env);
  return !!base && !!token;
}

// User API — only used for the email→network→eeros fallback lookup.
function userConfig(env: Env): { base: string; token: string | undefined } {
  if (env === 'stage') {
    return { base: process.env.EERO_USER_API_BASE_STAGE || '', token: process.env.EERO_API_TOKEN_STAGE };
  }
  return {
    base: process.env.EERO_USER_API_BASE_PROD || process.env.EERO_USER_API_BASE || 'https://api-user.e2ro.com',
    token: process.env.EERO_API_TOKEN_PROD || process.env.EERO_API_TOKEN,
  };
}
function userLive(env: Env): boolean {
  const { base, token } = userConfig(env);
  return !!base && !!token;
}

// Generic authenticated GET → returns the unwrapped `data` payload.
async function apiGet(base: string, token: string | undefined, path: string): Promise<any> {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`eero ${res.status} for ${path}`);
  const body = await res.json();
  return body?.data ?? body;
}

// Last non-empty path segment of a URL like "/networks/17001087" → "17001087".
function idFromUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const id = url.split('/').filter(Boolean).pop();
  return id || null;
}

type MatchState = 'matched' | 'multiple' | 'unmatched';
interface InsightEero { serial: string; model: string; firmware: string; online: boolean }
interface ResolvedDevice { serial: string; online: boolean; networkId: string | null; firmware: string; model: string; found: boolean }
interface SerialInput { serial: string; network?: string | null }

// ── Batch resolver (Admin API, option B) ───────────────────────────────────────
// 1) by-serial ONLY the serials whose network we don't already know → learn networkId
// 2) fetch each UNIQUE network once → nodes[] gives serial+status+firmware for all
async function resolveSerialsLive(items: SerialInput[], env: Env): Promise<Map<string, ResolvedDevice>> {
  const { base, token } = adminConfig(env);
  const out = new Map<string, ResolvedDevice>();
  const networkOf = new Map<string, string>(); // serial → networkId
  const networks = new Set<string>();

  // Step 1: partition — known networks go straight in; unknowns get a by-serial lookup.
  for (const it of items) {
    const serial = it.serial.trim().toUpperCase();
    if (it.network) {
      networkOf.set(serial, String(it.network));
      networks.add(String(it.network));
    }
  }
  const unknown = items.map((i) => i.serial.trim().toUpperCase()).filter((s) => !networkOf.has(s));
  await Promise.all(unknown.map(async (serial) => {
    try {
      const e = await apiGet(base, token, `/eeros/serial/${encodeURIComponent(serial)}`);
      const nid = idFromUrl(e?.network?.url);
      if (nid) { networkOf.set(serial, nid); networks.add(nid); }
      else out.set(serial, { serial, online: false, networkId: null, firmware: '', model: e?.model || '', found: false });
    } catch {
      out.set(serial, { serial, online: false, networkId: null, firmware: '', model: '', found: false });
    }
  }));

  // Step 2: fetch each unique network once → map every node by serial.
  const nodeBySerial = new Map<string, { online: boolean; firmware: string; model: string; networkId: string }>();
  await Promise.all(Array.from(networks).map(async (nid) => {
    try {
      const net = await apiGet(base, token, `/networks/${encodeURIComponent(nid)}`);
      (net?.nodes || []).forEach((n: any) => {
        const s = (n.serial || '').toUpperCase();
        if (!s) return;
        nodeBySerial.set(s, {
          online: n.status === 'green' || n.status === 'online',
          firmware: n.firmware || n.os || '',
          model: n.model || '',
          networkId: nid,
        });
      });
    } catch { /* network fetch failed — its serials fall through to not-found */ }
  }));

  // Step 3: assemble a result for every requested serial.
  for (const it of items) {
    const serial = it.serial.trim().toUpperCase();
    if (out.has(serial)) continue; // already marked not-found in step 1
    const node = nodeBySerial.get(serial);
    if (node) {
      out.set(serial, { serial, online: node.online, networkId: node.networkId, firmware: node.firmware, model: node.model, found: true });
    } else {
      out.set(serial, { serial, online: false, networkId: networkOf.get(serial) || null, firmware: '', model: '', found: false });
    }
  }
  return out;
}

// ── User API email→network→beta-unit (secondary fallback lookup) ───────────────
interface LookupResult {
  source: 'live' | 'seed'; env: Env; email: string; betaModel: string | null;
  match: MatchState; networkId: string | null; devices: InsightEero[]; allEeros?: InsightEero[]; warning?: string;
}
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
async function resolveNetworkIdByEmail(email: string, env: Env): Promise<string | null> {
  const { base, token } = userConfig(env);
  const data = await apiGet(base, token, `/2.3/search?q=${encodeURIComponent(email)}`);
  const networks = data?.networks || [];
  const first = networks[0];
  return first ? (first.id ? String(first.id) : idFromUrl(first.url || first.network)) : null;
}
async function fetchNetworkEerosUser(networkId: string, env: Env): Promise<InsightEero[]> {
  const { base, token } = userConfig(env);
  const data = await apiGet(base, token, `/2.2/networks/${networkId}/eeros`);
  const rows = data?.eeros || data || [];
  return (Array.isArray(rows) ? rows : []).map((e: any) => ({
    serial: e.serial || e.serial_number || '',
    model: e.model || e.model_number || '',
    firmware: e.os || e.os_version || e.firmware || '',
    online: e.status === 'green' || e.status === 'online' || e.connected === true,
  }));
}

// ── Seeded fallback (deterministic) — mirrors the demo mix ─────────────────────
interface SerialResult {
  source: 'live' | 'seed'; env: Env; serial: string;
  match: 'matched' | 'unmatched'; networkId: string | null; device: InsightEero | null; warning?: string;
}
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function seededSerialLookup(serial: string, env: Env): SerialResult {
  const seed = hashSeed(serial);
  if (seed % 12 === 0) return { source: 'seed', env, serial, match: 'unmatched', networkId: null, device: null };
  const device: InsightEero = { serial, model: 'Merci', firmware: 'v7.3-beta', online: seed % 5 !== 0 };
  return { source: 'seed', env, serial, match: 'matched', networkId: String(17000000 + (seed % 99999)), device };
}
function seededLookup(email: string, betaModel: string | null, env: Env): LookupResult {
  const seed = hashSeed(email);
  const model = betaModel || 'Merci';
  const mkSerial = (n: number) => `GGC54MX36114${(4000 + n).toString(36).toUpperCase().padStart(4, '0')}`;
  const r = seed % 10;
  if (r === 2 || r === 9) return { source: 'seed', env, email, betaModel, match: 'unmatched', networkId: null, devices: [] };
  const networkId = String(17000000 + (seed % 99999));
  if (r === 5) {
    const devices: InsightEero[] = [
      { serial: mkSerial(seed % 900 + 1), model, firmware: 'v7.3-beta', online: true },
      { serial: mkSerial(seed % 900 + 2), model, firmware: 'v7.3-beta', online: seed % 2 === 0 },
    ];
    return { source: 'seed', env, email, betaModel, match: 'multiple', networkId, devices, allEeros: devices };
  }
  const beta: InsightEero = { serial: mkSerial(seed % 900 + 3), model, firmware: 'v7.3-beta', online: r !== 4 };
  return { source: 'seed', env, email, betaModel, match: 'matched', networkId, devices: [beta], allEeros: [beta] };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serial = searchParams.get('serial');
  const email = searchParams.get('email');
  const betaModel = searchParams.get('model');
  const env = parseEnv(searchParams.get('env'));

  // Readiness probe (per env, both APIs) for the sync connection badge.
  if (searchParams.get('op') === 'status') {
    const a = { prod: adminLive('prod'), stage: adminLive('stage') };
    const u = { prod: userLive('prod'), stage: userLive('stage') };
    return NextResponse.json({
      ready: a.prod || a.stage,
      source: a.prod || a.stage ? 'live' : 'seed',
      identity: `admin[prod:${a.prod ? 'live' : 'seed'}, stage:${a.stage ? 'live' : adminConfig('stage').base ? 'seed' : 'n/a'}]`,
      envs: {
        prod: { ready: a.prod, adminConfigured: !!adminConfig('prod').base, userReady: u.prod },
        stage: { ready: a.stage, adminConfigured: !!adminConfig('stage').base, userReady: u.stage },
      },
    });
  }

  // Serial-anchored (PREFERRED) — Admin API via the batch resolver (single serial).
  if (serial) {
    if (!adminLive(env)) return NextResponse.json(seededSerialLookup(serial, env));
    try {
      const map = await resolveSerialsLive([{ serial }], env);
      const r = map.get(serial.trim().toUpperCase());
      const result: SerialResult = r && r.found
        ? { source: 'live', env, serial, match: 'matched', networkId: r.networkId, device: { serial, model: r.model, firmware: r.firmware, online: r.online } }
        : { source: 'live', env, serial, match: 'unmatched', networkId: r?.networkId ?? null, device: null };
      return NextResponse.json(result);
    } catch (err: any) {
      return NextResponse.json({ ...seededSerialLookup(serial, env), warning: err.message });
    }
  }

  // Email-anchored (fallback) — User API.
  if (!email) return NextResponse.json({ error: 'serial or email is required' }, { status: 400 });
  if (!userLive(env)) return NextResponse.json(seededLookup(email, betaModel, env));
  try {
    const networkId = await resolveNetworkIdByEmail(email, env);
    if (!networkId) return NextResponse.json({ source: 'live', env, email, betaModel, match: 'unmatched', networkId: null, devices: [] } as LookupResult);
    const allEeros = await fetchNetworkEerosUser(networkId, env);
    const devices = filterBetaUnits(allEeros, betaModel);
    return NextResponse.json({ source: 'live', env, email, betaModel, match: matchState(devices), networkId, devices, allEeros } as LookupResult);
  } catch (err: any) {
    return NextResponse.json({ ...seededLookup(email, betaModel, env), warning: err.message });
  }
}

// ── Batch device sync ─────────────────────────────────────────────────────────
// POST { op:'sync', env?, items?: [{serial, network?}], serials?: string[] }
// Returns the SAME shape /api/databricks returns. `items` carry a known networkId
// when the caller has one (so we skip the by-serial discovery for those).
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { op?: string; serials?: unknown[]; items?: unknown[]; env?: string };
  if (body.op !== 'sync') {
    return NextResponse.json({ success: false, error: 'expected { op: "sync", items|serials, env? }' }, { status: 400 });
  }
  const env = parseEnv(body.env);

  // Normalize to SerialInput[] (accept either items or bare serials).
  let items: SerialInput[] = [];
  if (Array.isArray(body.items)) {
    items = body.items.map((i: any) => ({ serial: String(i.serial || ''), network: i.network ? String(i.network) : null })).filter((i) => i.serial);
  } else if (Array.isArray(body.serials)) {
    items = body.serials.map((s) => ({ serial: String(s) })).filter((i) => i.serial);
  } else {
    return NextResponse.json({ success: false, error: 'expected items[] or serials[]' }, { status: 400 });
  }

  const statuses: { serial: string; online: boolean }[] = [];
  const testers: { serial: string; network: string; firmware?: string }[] = [];
  const notFound: string[] = [];

  if (!adminLive(env)) {
    // Seeded fallback per serial.
    items.forEach((it) => {
      const r = seededSerialLookup(it.serial, env);
      if (r.match === 'unmatched' || !r.device) { notFound.push(it.serial); statuses.push({ serial: it.serial, online: false }); return; }
      statuses.push({ serial: it.serial, online: r.device.online });
      if (r.networkId) testers.push({ serial: it.serial, network: r.networkId, firmware: r.device.firmware });
    });
  } else {
    try {
      const map = await resolveSerialsLive(items, env);
      items.forEach((it) => {
        const r = map.get(it.serial.trim().toUpperCase());
        if (!r || !r.found) { notFound.push(it.serial); statuses.push({ serial: it.serial, online: false }); return; }
        statuses.push({ serial: it.serial, online: r.online });
        if (r.networkId) testers.push({ serial: it.serial, network: r.networkId, firmware: r.firmware });
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message || 'sync failed' }, { status: 502 });
    }
  }

  return NextResponse.json({
    success: true,
    env,
    source: adminLive(env) ? 'live' : 'seed',
    statuses,
    testers,
    onlineCount: statuses.filter((s) => s.online).length,
    notFound,
  });
}
