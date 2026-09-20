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

// Up to two uppercase initials from a name ("Aaron Rivera" → "AR").
export const initials = (name?: string) =>
  (name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// A pending return is "overdue" once its return email is 2+ weeks old.
export const RETURN_OVERDUE_MS = 14 * 24 * 60 * 60 * 1000;
export const isReturnOverdue = (returnEmailSentAt?: string, now: number = Date.now()) =>
  !!returnEmailSentAt && now - new Date(returnEmailSentAt).getTime() >= RETURN_OVERDUE_MS;
