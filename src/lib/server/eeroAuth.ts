// Server-only: where the app gets its eero API sign-in.
//
// Order (first one found wins):
//   1. Env var token (EERO_ADMIN_API_TOKEN_PROD / _STAGE) — for hosted deploys (Harmony).
//   2. The eero CLI's own credential store on this machine (`eero creds get <api host>`),
//      i.e. whoever ran `eero api admin --prod auth`. Nothing is copied into the repo
//      or .env — every person who clones the app uses their own sign-in.
// No sign-in → the API routes fall back to demo data and the UI says how to connect.
//
// Tokens never leave the server and are never logged.
import { execFile } from 'node:child_process';

export type EeroEnv = 'prod' | 'stage';
export type AuthState = 'connected' | 'not_signed_in' | 'expired' | 'cli_missing' | 'error';

export interface EeroAuthStatus {
  env: EeroEnv;
  state: AuthState;
  source: 'env' | 'eero-cli' | 'none';
  user?: string;   // eero account the CLI is signed in as (no secrets)
  fix?: string;    // the exact command to run, when not connected
}

const ADMIN_BASE: Record<EeroEnv, string> = {
  prod: process.env.EERO_ADMIN_API_BASE_PROD || 'https://api-admin.e2ro.com',
  stage: process.env.EERO_ADMIN_API_BASE_STAGE || 'https://api-admin.stage.e2ro.com',
};
const ENV_TOKEN: Record<EeroEnv, string | undefined> = {
  prod: process.env.EERO_ADMIN_API_TOKEN_PROD,
  stage: process.env.EERO_ADMIN_API_TOKEN_STAGE,
};
export const AUTH_COMMAND: Record<EeroEnv, string> = {
  prod: 'eero api admin --prod auth',
  stage: 'eero api admin auth',
};

const CLI = process.env.EERO_CLI_PATH || 'eero';
const CACHE_MS = 60_000;

interface CacheEntry { token: string | null; user?: string; state: AuthState; at: number }
const cache = new Map<EeroEnv, CacheEntry>();
const expired = new Set<EeroEnv>(); // set after a 401 until the CLI hands out a new token

export function adminBase(env: EeroEnv): string {
  return ADMIN_BASE[env];
}

function hostOf(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}

function run(args: string[]): Promise<{ out: string; missing: boolean }> {
  return new Promise((resolve) => {
    execFile(CLI, args, { timeout: 8000, env: { ...process.env, NO_COLOR: '1' } }, (err, stdout) => {
      const missing = !!err && (err as NodeJS.ErrnoException).code === 'ENOENT';
      resolve({ out: err ? '' : String(stdout || ''), missing });
    });
  });
}

// `eero creds get <host>` prints the stored token (it looks like "<id>|<secret>" —
// the WHOLE line is the token). Default user comes from `creds list`.
async function readCli(env: EeroEnv): Promise<CacheEntry> {
  const host = hostOf(ADMIN_BASE[env]);
  const got = await run(['creds', 'get', host]);
  if (got.missing) return { token: null, state: 'cli_missing', at: Date.now() };
  const line = got.out.trim().split('\n').pop() || '';
  const token = line.trim();
  if (!token) return { token: null, state: 'not_signed_in', at: Date.now() };
  const list = await run(['creds', 'list']);
  const row = list.out.split('\n').find((l) => l.includes(host));
  const user = row?.match(/[\w.+-]+@[\w.-]+/)?.[0];
  return { token, user, state: 'connected', at: Date.now() };
}

async function resolve(env: EeroEnv): Promise<CacheEntry> {
  const fromEnv = ENV_TOKEN[env];
  if (fromEnv) return { token: fromEnv, state: expired.has(env) ? 'expired' : 'connected', at: Date.now() };
  const hit = cache.get(env);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;
  const fresh = await readCli(env);
  // A 401 earlier means this token is dead; if the CLI still returns the same one,
  // the person hasn't re-authenticated yet.
  if (fresh.token && expired.has(env) && hit?.token === fresh.token) fresh.state = 'expired';
  else if (fresh.token) expired.delete(env);
  cache.set(env, fresh);
  return fresh;
}

/** Token for live Admin API calls, or null (→ demo data). */
export async function getAdminToken(env: EeroEnv): Promise<string | null> {
  const r = await resolve(env);
  return r.state === 'connected' ? r.token : null;
}

/** Call after the Admin API answers 401, so the UI shows "session expired". */
export function markExpired(env: EeroEnv) {
  expired.add(env);
  const hit = cache.get(env);
  if (hit) cache.set(env, { ...hit, state: 'expired' });
}

export async function getAuthStatus(env: EeroEnv): Promise<EeroAuthStatus> {
  const r = await resolve(env);
  const source = ENV_TOKEN[env] ? 'env' : r.state === 'cli_missing' ? 'none' : r.token ? 'eero-cli' : 'none';
  return {
    env,
    state: r.state,
    source,
    user: r.user,
    fix: r.state === 'connected'
      ? undefined
      : r.state === 'cli_missing'
        ? 'Install the eero CLI (see README → "Connect to eero"), then run: ' + AUTH_COMMAND[env]
        : AUTH_COMMAND[env] + '   (on VPN)',
  };
}

/**
 * Cheap authenticated check: one Admin API GET. Confirms the stored session is
 * actually accepted (a token can exist but be expired).
 */
export async function verifyAdmin(env: EeroEnv): Promise<EeroAuthStatus> {
  // Re-read the CLI sign-in (someone may have just run the auth command), then probe.
  cache.delete(env);
  expired.delete(env);
  const token = await getAdminToken(env);
  if (token) {
    try {
      // Well-formed but non-existent serial: 401 when the session is bad, 404 when it's good.
      const res = await fetch(`${ADMIN_BASE[env]}/eeros/serial/GGC0000000000000`, {
        headers: { 'X-Admin-Token': token, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) markExpired(env);
      else if (res.ok || res.status === 404) expired.delete(env);
    } catch { /* network/VPN issue — leave state as-is */ }
  }
  return getAuthStatus(env);
}
