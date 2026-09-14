/**
 * Engagement client — the seam between the Engagement view and live Qualtrics
 * survey-response data.
 *
 * Flow: Qualtrics fires a `completedResponse` webhook when a tester submits →
 * /api/qualtrics/webhook ingests it → /api/engagement serves the computed
 * per-tester engagement → the Engagement view overlays it onto the roster.
 *
 * Until ENGAGEMENT_LIVE is on (and responses have arrived) the view keeps its
 * simulated metrics, so nothing breaks in the demo.
 */

// Per-tester engagement computed from real survey responses (keyed by email).
export interface LiveEngagement {
  email: string;
  responses: number;         // completed responses received
  reliability: number;       // 0-100, responded ÷ invited
  avgResponseDays: number;   // avg (sent → completed)
  feedbackQuality: number;   // 1-5 avg rating
  missedSurveys: number;     // invited but not completed
  lastResponseAt: string | null;
}

export interface EngagementFeed {
  source: 'live' | 'none';
  byEmail: Record<string, LiveEngagement>;
  updatedAt: string | null;
}

// Flip on in the live environment to overlay real Qualtrics engagement onto the
// roster. Off by default so the demo keeps its simulated metrics.
export const ENGAGEMENT_LIVE = process.env.NEXT_PUBLIC_ENGAGEMENT_SOURCE === 'qualtrics';

export async function fetchLiveEngagement(): Promise<EngagementFeed> {
  const res = await fetch('/api/engagement');
  if (!res.ok) throw new Error(`engagement ${res.status}`);
  return res.json();
}
