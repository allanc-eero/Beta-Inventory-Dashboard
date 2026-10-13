/**
 * Small shared pure helpers — eero platform deep-links, name formatting, and
 * return-overdue math. Extracted so these patterns live in one place instead of
 * being re-typed across components.
 */

// ─── Environment-aware deep-links ─────────────────────────────────────────────
// Beta testers live in PRODUCTION (insight.eero.com / admin.e2ro.com); dogfooders
// live in STAGE. A device's target env is taken from its `environment` field when
// set (shapeshift stamps it), else inferred from its cohort (program 'dogfood' →
// stage, everything else → prod). Prod hosts are known/hardcoded; stage hosts come
// confirmed for the dogfood/stage env (admin.stage.e2ro.com / stage.insight.e2ro.com)
// and baked in as defaults; env vars override if the stage flavor ever changes. If a
// host is ever blank the helper returns '' and callers render plain text (no broken link).
export type EeroEnv = 'stage' | 'prod';

const HOSTS: Record<EeroEnv, { admin: string; insight: string }> = {
  prod: {
    admin: 'https://admin.e2ro.com',
    insight: 'https://insight.eero.com',
  },
  stage: {
    // Confirmed dogfood/stage hosts (env vars override if the flavor ever changes).
    admin: process.env.NEXT_PUBLIC_ADMIN_STAGE_URL || 'https://admin.stage.e2ro.com',
    insight: process.env.NEXT_PUBLIC_INSIGHT_STAGE_URL || 'https://stage.insight.e2ro.com',
  },
};

// Resolve the target env for a link: explicit device.environment wins; otherwise
// infer from cohort (dogfood → stage, everything else → prod).
export function resolveEnv(environment?: string, program?: string): EeroEnv {
  if (environment === 'stage' || environment === 'prod') return environment;
  return (program || '').toLowerCase().includes('dogfood') ? 'stage' : 'prod';
}

// eero admin keys users by their numeric UID; our stored IDs carry a "UID0…"
// prefix, so strip it for the link.
const stripUid = (uid: string) => uid.replace(/^UID0*/, '');

// Each helper returns '' when the target env's host isn't configured (stage before
// the platform hostnames are set), so callers can fall back to plain text.
export const adminUserUrl = (uid: string, env: EeroEnv = 'prod') => {
  const base = HOSTS[env].admin;
  return base ? `${base}/users/${stripUid(uid)}` : '';
};
export const insightNetworkUrl = (networkId: string, env: EeroEnv = 'prod') => {
  const base = HOSTS[env].insight;
  return base ? `${base}/networks/${networkId}` : '';
};
export const adminNetworkUrl = (networkId: string, env: EeroEnv = 'prod') => {
  const base = HOSTS[env].admin;
  return base ? `${base}/networks/${networkId}` : '';
};

// ─── Network verification (never deep-link a fabricated network) ─────────────
// Insight/Admin UI routes are keyed by NETWORK id (/networks/{id}) or user id
// (/users/{id}); there is no documented UI route that resolves an eero SERIAL
// (Insight's /eeros/{id} takes the numeric eero id, not the serial; the by-serial
// lookup only exists on the Admin API, api-admin…/eeros/serial/{s}). So a link is
// only as correct as the network id stored on the device.
//
// Two demo paths fabricate ids deterministically, and those values are persisted:
//  - programs/helpers.ts seedAssignments → network 17000000 + hash(email) % 99999
//    and unitId UID000{2900000 + hash(serial) % 99999} (toStoreDevice)
//  - /api/insight seeded sync (no admin token) → network 17000000 + hash(serial) % 99999,
//    which networkSync then writes onto device.network
// They look real but point at a random customer's network, so detect them at
// render time and suppress the link.
const seedHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const fakeNetworkFor = (s: string) => String(17000000 + (seedHash(s) % 99999));
const variants = (s?: string) => {
  const v = (s || '').trim();
  return v ? Array.from(new Set([v, v.toUpperCase(), v.toLowerCase()])) : [];
};

export const NETWORK_UNCONFIRMED_TIP = 'Network not confirmed yet — links appear after the online check';

/** True when `network` is set and is NOT one of the demo-fabricated ids for this serial/email. */
export function isVerifiedNetwork(network: string | null | undefined, serials: (string | undefined)[] = [], emails: (string | undefined)[] = []): boolean {
  const n = (network || '').trim();
  if (!/^\d+$/.test(n)) return false;
  const keys = [...serials.flatMap(variants), ...emails.flatMap(variants)];
  return !keys.some((k) => fakeNetworkFor(k) === n);
}

/** True when `unitId` is set and is NOT the demo-fabricated UID for this serial. */
export function isVerifiedUnitId(unitId: string | null | undefined, serials: (string | undefined)[] = []): boolean {
  const u = (unitId || '').trim();
  if (!u) return false;
  return !serials.flatMap(variants).some((s) => u === `UID000${2900000 + (seedHash(s) % 99999)}`);
}

type LinkableDevice = { serialNumber: string; network?: string; unitId?: string; assignedEmail?: string; environment?: string; program?: string };

/**
 * One place to build a device's deep-links. Env: beta → prod, dogfood → stage
 * (explicit device.environment wins). URLs are '' when the network/UID is missing
 * or unverified, or the env host isn't configured — callers render plain text.
 */
export function deviceLinks(d: LinkableDevice) {
  const env = resolveEnv(d.environment, d.program);
  const networkVerified = isVerifiedNetwork(d.network, [d.serialNumber], [d.assignedEmail]);
  const unitVerified = isVerifiedUnitId(d.unitId, [d.serialNumber]);
  return {
    env,
    networkVerified,
    insightUrl: networkVerified ? insightNetworkUrl(d.network!.trim(), env) : '',
    adminNetworkUrl: networkVerified ? adminNetworkUrl(d.network!.trim(), env) : '',
    adminUserUrl: unitVerified ? adminUserUrl(d.unitId!, env) : '',
  };
}

// Up to two uppercase initials from a name ("Aaron Rivera" → "AR").
export const initials = (name?: string) =>
  (name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// A pending return is "overdue" once its return email is 2+ weeks old.
export const RETURN_OVERDUE_MS = 14 * 24 * 60 * 60 * 1000;
export const isReturnOverdue = (returnEmailSentAt?: string, now: number = Date.now()) =>
  !!returnEmailSentAt && now - new Date(returnEmailSentAt).getTime() >= RETURN_OVERDUE_MS;
