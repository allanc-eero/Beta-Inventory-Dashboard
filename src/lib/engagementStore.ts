import type { LiveEngagement } from './engagement';

/**
 * Server-side ingestion store for survey responses that arrive via the Qualtrics
 * webhook. In-memory for now (dev/demo) — kept on globalThis so it survives Next
 * HMR reloads. In production this becomes a durable table (DynamoDB) in the
 * Insight/Breadboard backend; the read/write surface below stays the same.
 */

export interface IngestedResponse {
  responseId: string;
  surveyId: string;
  email: string;
  completedAt: string;   // ISO
  sentAt?: string;       // ISO — when the survey was sent (for response-time)
  rating?: number;       // 1-5 feedback quality, if the survey carried one
}

interface EngagementState {
  responses: IngestedResponse[];
  // Invited counts per tester email (from distributions/roster) so reliability
  // and missed-survey counts are real, not assumed. Optional until wired.
  invited: Record<string, number>;
}

const g = globalThis as unknown as { __eeroEngagement?: EngagementState };
if (!g.__eeroEngagement) g.__eeroEngagement = { responses: [], invited: {} };
const state = g.__eeroEngagement;

// Record a completed response (idempotent by responseId).
export function recordResponse(r: IngestedResponse) {
  const email = r.email.toLowerCase().trim();
  if (!r.responseId) return;
  if (state.responses.some((x) => x.responseId === r.responseId)) return;
  state.responses.push({ ...r, email });
}

// Optionally set how many surveys a tester was invited to (drives reliability +
// missed counts). TODO(verify): source from Qualtrics distributions or the roster.
export function setInvited(email: string, count: number) {
  state.invited[email.toLowerCase().trim()] = count;
}

export function getResponseCount() {
  return state.responses.length;
}

// Aggregate raw responses into per-tester engagement.
export function computeEngagement(): Record<string, LiveEngagement> {
  const byEmail: Record<string, IngestedResponse[]> = {};
  for (const r of state.responses) (byEmail[r.email] ||= []).push(r);

  const out: Record<string, LiveEngagement> = {};
  for (const [email, rs] of Object.entries(byEmail)) {
    const responses = rs.length;

    const ratings = rs.map((r) => r.rating).filter((n): n is number => typeof n === 'number');
    const feedbackQuality = ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    const days = rs
      .map((r) => (r.sentAt ? (new Date(r.completedAt).getTime() - new Date(r.sentAt).getTime()) / 86400000 : null))
      .filter((n): n is number => n != null && n >= 0);
    const avgResponseDays = days.length ? +(days.reduce((a, b) => a + b, 0) / days.length).toFixed(1) : 0;

    const lastResponseAt = rs.map((r) => r.completedAt).sort().at(-1) || null;

    // reliability + missed need the invited count; fall back to "all invited
    // responded" when we don't yet have it. TODO(verify): wire invited counts.
    const invited = state.invited[email] ?? responses;
    const reliability = invited > 0 ? Math.round((responses / invited) * 100) : 100;
    const missedSurveys = Math.max(0, invited - responses);

    out[email] = { email, responses, reliability, avgResponseDays, feedbackQuality, missedSurveys, lastResponseAt };
  }
  return out;
}
