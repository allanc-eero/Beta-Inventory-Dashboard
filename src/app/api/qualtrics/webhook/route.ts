import { NextRequest, NextResponse } from 'next/server';
import { recordResponse } from '@/lib/engagementStore';

/**
 * QUALTRICS WEBHOOK RECEIVER — completedResponse events.
 *
 * Qualtrics fires this the moment a tester submits a survey. We ingest the
 * response into the engagement store; the Engagement view reads it back via
 * /api/engagement. No polling.
 *
 * ── REGISTER (one-time, needs a PUBLIC url — localhost won't receive callbacks) ─
 *   Subscribe per survey to topic `completedResponse.{surveyId}` with
 *   publicationUrl = https://<host>/api/qualtrics/webhook  (see handoff doc).
 *
 * ── TODO(verify) when wiring live ─────────────────────────────────────────────
 *   - The exact completedResponse payload field names.
 *   - Whether the tester email + rating are in the payload or require a follow-up
 *     fetch of the full response by ResponseID via the Qualtrics responses API.
 *   - Shared-secret / signature verification scheme Qualtrics offers.
 */

const WEBHOOK_SECRET = process.env.QUALTRICS_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Optional shared-secret gate (header or ?secret=) so only Qualtrics can post.
  if (WEBHOOK_SECRET) {
    const provided = request.headers.get('x-qualtrics-secret') || new URL(request.url).searchParams.get('secret');
    if (provided !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;

  // TODO(verify): confirm field names against a real completedResponse payload.
  const surveyId = String(body.SurveyID || body.surveyId || '');
  const responseId = String(body.ResponseID || body.responseId || '');
  if (!responseId) return NextResponse.json({ error: 'no responseId' }, { status: 400 });

  // Identity + rating: from the payload's embedded data / values. If absent, the
  // live wiring fetches the full response by ResponseID (TODO(verify)).
  const email = String(body.email || body.RecipientEmail || body.values?.email || '').toLowerCase();
  const completedAt = String(body.CompletedDate || body.completedAt || new Date().toISOString());
  const sentAt = body.sentAt ? String(body.sentAt) : undefined;
  const rating = typeof body.rating === 'number' ? body.rating : undefined;

  recordResponse({ responseId, surveyId, email, completedAt, sentAt, rating });

  // ── Re-summarize call point ───────────────────────────────────────────────
  // A new response landed → the survey's AI summary is now stale. Summaries are
  // generated on demand via POST /api/summarize (Bedrock), so the next results
  // view reflects this response. To pre-warm/cache instead, fetch the survey's
  // full responses from the Qualtrics responses API here and call the summarizer.
  // TODO(verify): wire the Qualtrics responses fetch for pre-warm caching.

  return NextResponse.json({ ok: true, responseId });
}
