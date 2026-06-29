import { NextRequest, NextResponse } from 'next/server';

// ─── Databricks: read-only tester lookup (locked down) ────────────────────────
// PURPOSE: refresh a device's tester info (name / email / network / location)
// from Databricks — the source of truth — keyed by the device serial number.
//
// SECURITY POSTURE (deliberate):
//   • There is NO general SQL-runner endpoint. The client cannot send arbitrary
//     SQL. The only statements this route ever runs are the read-only,
//     parameterized SELECTs and metadata queries hard-coded below.
//   • Serial values are bound as query PARAMETERS (:serial), never string-
//     concatenated — no SQL injection surface.
//   • A regex guard rejects any built statement that isn't SELECT/SHOW/DESCRIBE,
//     as a belt-and-suspenders check on top of the hard-coded queries.
//   • The Databricks token should belong to a SERVICE PRINCIPAL with SELECT-only
//     grants on just the tester table — not a personal full-access PAT.
//
// .env.local (server-only — gitignored):
//   DATABRICKS_HOST           e.g. https://eero.cloud.databricks.com (no trailing /)
//   DATABRICKS_TOKEN          service-principal token (read-only)
//   DATABRICKS_WAREHOUSE_ID   SQL Warehouse to run on
//   DATABRICKS_TESTER_TABLE   fully-qualified table/view, e.g. prod.beta.device_testers
//   DATABRICKS_TESTER_COLUMNS optional JSON mapping of logical→physical columns
//                             (see COLS below). Lets us adapt without code edits.

export const dynamic = 'force-dynamic';

const HOST = (process.env.DATABRICKS_HOST || '').replace(/\/+$/, '');
const TOKEN = process.env.DATABRICKS_TOKEN || '';
const WAREHOUSE_ID = process.env.DATABRICKS_WAREHOUSE_ID || '';
const TESTER_TABLE = process.env.DATABRICKS_TESTER_TABLE || '';

// Logical→physical column mapping for SINGLE-TABLE mode (used only if a
// pre-joined view is configured via DATABRICKS_TESTER_TABLE). Override via env.
const DEFAULT_COLS = {
  serial: 'serial_number',
  name: 'tester_name',
  email: 'tester_email',
  network: 'network_link',
  location: 'location',
};
function cols(): typeof DEFAULT_COLS {
  try {
    const raw = process.env.DATABRICKS_TESTER_COLUMNS;
    return raw ? { ...DEFAULT_COLS, ...JSON.parse(raw) } : DEFAULT_COLS;
  } catch {
    return DEFAULT_COLS;
  }
}

// JOIN MODE (default when no pre-joined view is configured). The tester for a
// device is the OWNER of the network the eero is on. Verified chain:
//   node_sessions  (serial_number → network_id, where not revoked)
//     → network_admins (network_id, role='network-owner' → user_id)
//       → users         (id → name, email, city)
// FQ table names are env-overridable; the JOIN STRUCTURE is fixed in code.
const JOIN_TABLES = {
  nodes: process.env.DATABRICKS_NODES_TABLE || 'redshift_catalog.core.node_sessions',
  admins: process.env.DATABRICKS_ADMINS_TABLE || 'redshift_catalog.core.network_admins',
  users: process.env.DATABRICKS_USERS_TABLE || 'redshift_catalog.core.users',
};

// Identifiers we build into SQL (table + column names) must be safe. Allow only
// word chars, dots (for catalog.schema.table) and backticks-free segments.
const SAFE_IDENT = /^[A-Za-z0-9_.]+$/;

const SAFE_STATEMENT = /^\s*(SELECT|SHOW|DESCRIBE|DESC)\b/i;

function configError(): string | null {
  const missing: string[] = [];
  if (!HOST) missing.push('DATABRICKS_HOST');
  if (!TOKEN) missing.push('DATABRICKS_TOKEN');
  if (!WAREHOUSE_ID) missing.push('DATABRICKS_WAREHOUSE_ID');
  if (missing.length === 0) return null;
  return `Databricks not configured. Missing in .env.local: ${missing.join(', ')}.`;
}

async function dbx(pathname: string, init?: RequestInit) {
  const res = await fetch(`${HOST}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

// Run a read-only statement. `statement` is ALWAYS server-built (never from the
// client). Optional named parameters are bound by Databricks, not interpolated.
async function runReadOnly(
  statement: string,
  params?: Array<{ name: string; value: string; type?: string }>,
) {
  if (!SAFE_STATEMENT.test(statement)) {
    throw new Error('Refused: only read-only statements are permitted.');
  }
  const exec = await dbx('/api/2.0/sql/statements', {
    method: 'POST',
    body: JSON.stringify({
      warehouse_id: WAREHOUSE_ID,
      statement,
      wait_timeout: '50s',
      on_wait_timeout: 'CONTINUE',
      ...(params ? { parameters: params } : {}),
    }),
  });
  if (!exec.ok) {
    const msg = typeof exec.body === 'object' ? exec.body?.message || JSON.stringify(exec.body) : exec.body;
    throw new Error(`Databricks ${exec.status}: ${msg}`);
  }
  const r = exec.body;
  const state = r?.status?.state;
  if (state === 'FAILED' || state === 'CANCELED' || state === 'CLOSED') {
    throw new Error(r?.status?.error?.message || `Statement ${state}`);
  }
  const schema = r?.manifest?.schema?.columns || [];
  return {
    state,
    columns: schema.map((c: any) => ({ name: c.name, type: c.type_name })),
    rows: r?.result?.data_array || [],
    statementId: r?.statement_id,
  };
}

// ─── GET: health check + (optional) read-only schema discovery ────────────────
//   /api/databricks                         → health: identity + warehouses
//   /api/databricks?discover=tables&in=catalog.schema  → SHOW TABLES
//   /api/databricks?discover=catalogs       → SHOW CATALOGS
//   /api/databricks?discover=schemas&in=catalog        → SHOW SCHEMAS
//   /api/databricks?discover=columns&in=catalog.schema.table → DESCRIBE
export async function GET(request: NextRequest) {
  const cfgErr = configError();
  if (cfgErr) return NextResponse.json({ configured: false, ready: false, error: cfgErr });

  const { searchParams } = new URL(request.url);
  const discover = searchParams.get('discover');
  const inTarget = searchParams.get('in') || '';

  try {
    if (discover) {
      if (inTarget && !SAFE_IDENT.test(inTarget)) {
        return NextResponse.json({ error: 'Invalid "in" identifier.' }, { status: 400 });
      }
      let statement = '';
      if (discover === 'catalogs') statement = 'SHOW CATALOGS';
      else if (discover === 'schemas') statement = `SHOW SCHEMAS IN ${inTarget}`;
      else if (discover === 'tables') statement = `SHOW TABLES IN ${inTarget}`;
      else if (discover === 'columns') statement = `DESCRIBE TABLE ${inTarget}`;
      else return NextResponse.json({ error: 'Unknown discover mode.' }, { status: 400 });

      const out = await runReadOnly(statement);
      return NextResponse.json({ ok: true, discover, in: inTarget || null, ...out });
    }

    // Health: list warehouses (proves token valid) + identity.
    const wh = await dbx('/api/2.0/sql/warehouses');
    if (!wh.ok) {
      return NextResponse.json({
        configured: true,
        ready: false,
        error: `Databricks API ${wh.status}: ${typeof wh.body === 'object' ? wh.body?.message || JSON.stringify(wh.body) : wh.body}`,
      });
    }
    const warehouses = (wh.body?.warehouses || []).map((w: any) => ({
      id: w.id, name: w.name, state: w.state, isDefault: w.id === WAREHOUSE_ID,
    }));
    const me = await dbx('/api/2.0/preview/scim/v2/Me');
    const identity = me.ok ? (me.body?.userName || me.body?.displayName || 'unknown') : 'unknown';

    return NextResponse.json({
      configured: true,
      ready: true,
      host: HOST,
      identity,
      warehouseConfigured: !!WAREHOUSE_ID,
      // Join mode works without a pre-joined view, so the lookup is always ready
      // once connected. A configured view (TESTER_TABLE) just overrides the join.
      testerTableConfigured: true,
      mode: TESTER_TABLE ? 'view' : 'join',
      testerTable: TESTER_TABLE || `${JOIN_TABLES.nodes} ⋈ network_admins ⋈ users`,
      warehouses,
    });
  } catch (error: any) {
    return NextResponse.json({ configured: true, ready: false, error: error.message || 'Connection failed' });
  }
}

// ─── POST: refresh tester info by serial (the ONLY write-adjacent action) ──────
// Body: { serials: string[] }  →  returns tester rows keyed by serial.
// This NEVER writes to Databricks; the client applies updates to its own store.
export async function POST(request: NextRequest) {
  const cfgErr = configError();
  if (cfgErr) return NextResponse.json({ success: false, error: cfgErr }, { status: 400 });

  try {
    const body = await request.json();
    const serials: string[] = Array.isArray(body?.serials)
      ? body.serials
      : body?.serial ? [body.serial] : [];

    if (serials.length === 0) {
      return NextResponse.json({ success: false, error: 'Provide "serial" or "serials" (array).' }, { status: 400 });
    }
    if (serials.length > 500) {
      return NextResponse.json({ success: false, error: 'Too many serials (max 500 per call).' }, { status: 400 });
    }

    // Validate serial format (alphanumeric eero serials).
    const cleanSerials = serials.map((s) => String(s).trim()).filter(Boolean);
    for (const s of cleanSerials) {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(s)) {
        return NextResponse.json({ success: false, error: `Invalid serial: ${s}` }, { status: 400 });
      }
    }

    // Build a parameterized IN (...) with named params :s0, :s1, ...
    const placeholders = cleanSerials.map((_, i) => `:s${i}`).join(', ');
    const params = cleanSerials.map((value, i) => ({ name: `s${i}`, value, type: 'STRING' }));

    let statement: string;

    if (TESTER_TABLE) {
      // ── VIEW MODE: a pre-joined view/table is configured. Single-table SELECT.
      const C = cols();
      for (const id of [TESTER_TABLE, C.serial, C.name, C.email, C.network, C.location]) {
        if (id && !SAFE_IDENT.test(id)) {
          return NextResponse.json({ success: false, error: `Unsafe identifier in config: ${id}` }, { status: 500 });
        }
      }
      statement =
        `SELECT ${C.serial} AS serial, ${C.name} AS name, ${C.email} AS email, ` +
        `${C.network} AS network, ${C.location} AS location ` +
        `FROM ${TESTER_TABLE} WHERE ${C.serial} IN (${placeholders})`;
    } else {
      // ── JOIN MODE (default): resolve serial → network → owner (the tester).
      // Structure is fixed here; only the serial VALUES are client-supplied
      // (bound as parameters). Read-only. A tester may own multiple devices on
      // the same network; we de-dupe to one row per serial via the network owner.
      for (const id of Object.values(JOIN_TABLES)) {
        if (!SAFE_IDENT.test(id)) {
          return NextResponse.json({ success: false, error: `Unsafe table identifier in config: ${id}` }, { status: 500 });
        }
      }
      statement =
        `SELECT ns.serial_number AS serial, u.name AS name, u.email AS email, ` +
        `CAST(ns.network_id AS STRING) AS network, u.city AS location ` +
        `FROM ${JOIN_TABLES.nodes} ns ` +
        `JOIN ${JOIN_TABLES.admins} na ON na.network_id = ns.network_id ` +
        `AND na.role = 'network-owner' AND na.deleted IS NULL ` +
        `JOIN ${JOIN_TABLES.users} u ON u.id = na.user_id ` +
        `WHERE ns.revoked IS NULL AND ns.serial_number IN (${placeholders}) ` +
        `QUALIFY ROW_NUMBER() OVER (PARTITION BY ns.serial_number ORDER BY ns.created DESC) = 1`;
    }

    const out = await runReadOnly(statement, params);

    // Map rows → objects keyed by serial.
    const colIdx: Record<string, number> = {};
    out.columns.forEach((c: any, i: number) => { colIdx[c.name] = i; });
    const testers = (out.rows as any[]).map((row) => ({
      serial: row[colIdx['serial']] ?? null,
      name: row[colIdx['name']] ?? null,
      email: row[colIdx['email']] ?? null,
      network: row[colIdx['network']] ?? null,
      location: row[colIdx['location']] ?? null,
    }));

    const found = testers.filter((t) => t.serial);
    const matchedSerials = new Set(found.map((t) => String(t.serial).toUpperCase()));
    const notFound = cleanSerials.filter((s) => !matchedSerials.has(s.toUpperCase()));

    return NextResponse.json({
      success: true,
      mode: TESTER_TABLE ? 'view' : 'join',
      requested: cleanSerials.length,
      matched: found.length,
      testers: found,
      notFound,
    });
  } catch (error: any) {
    console.error('[Databricks tester lookup]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
