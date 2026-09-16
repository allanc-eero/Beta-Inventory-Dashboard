/**
 * Small shared pure helpers — eero platform deep-links, name formatting, and
 * return-overdue math. Extracted so these patterns live in one place instead of
 * being re-typed across components.
 */

// eero admin keys users by their numeric UID; our stored IDs carry a "UID0…"
// prefix, so strip it for the link.
const stripUid = (uid: string) => uid.replace(/^UID0*/, '');

export const adminUserUrl = (uid: string) => `https://admin.e2ro.com/users/${stripUid(uid)}`;
export const insightNetworkUrl = (networkId: string) => `https://insight.eero.com/networks/${networkId}`;
export const adminNetworkUrl = (networkId: string) => `https://admin.e2ro.com/networks/${networkId}`;

// Up to two uppercase initials from a name ("Aaron Rivera" → "AR").
export const initials = (name?: string) =>
  (name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

// A pending return is "overdue" once its return email is 2+ weeks old.
export const RETURN_OVERDUE_MS = 14 * 24 * 60 * 60 * 1000;
export const isReturnOverdue = (returnEmailSentAt?: string, now: number = Date.now()) =>
  !!returnEmailSentAt && now - new Date(returnEmailSentAt).getTime() >= RETURN_OVERDUE_MS;
