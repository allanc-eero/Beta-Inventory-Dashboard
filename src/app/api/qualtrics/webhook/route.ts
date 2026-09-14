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
 *   node scripts/register-qualtrics-webhook.mjs --survey SV_xxx --url https://<host>
 *   Subscribes to topic `surveyengine.completedResponse.{surveyId}` with
 *   publicationUrl = https://<host>/api/qualtrics/webhook?secret=<QUALTRICS_WEBHOOK_SECRET>
 *
 * ── PAYLOAD SHAPE ─────────────────────────────────────────────────────────────
 *   A completedResponse event delivers an ENVELOPE (Topic, SurveyID, ResponseID,
 *   CompletedDate) — not the answers or the tester email. When those are absent
 *   we fetch the full response by ResponseID from the Qualtrics responses API
 *   (enrichResponse below) to pull the email (embedded data) and, if a rating
 *   question id is configured via QUALTRICS_RATING_QID, the 1-5 rating.
 */

const WEBHOOK_SECRET = process.env.QUALTRICS_WEBHOOK_SECRET;
const QUALTRICS_BASE_URL = process.env.QUALTRICS_BASE_URL;
const QUALTRICS_API_TOKEN = process.env.QUALTRICS_API_TOKEN;
// Optional: the question id that holds the tester's 1-5 rating (survey-specific).
const RATING_QID = process.env.QUALTRICS_RATING_QID;

// Normalize the base to end at /API/v3 exactly once.
function apiBase(): string | null {
  if (!QUALTRICS_BASE_URL) return null;
  return QUALTRICS_BASE_URL.replace(/\/+$/, '').replace(/\/API\/v3$/, '') + '/API/v3';
}

/**
 * Fetch the full response by ID to recover email + rating that the event
 * envelope omits. Best-effort: returns {} on any failure so the webhook still
 * records what it can.
 */
async function enrichResponse(
  surveyId: string,
  responseId: string
): Promise<{ email?: string; rating?: number; completedAt?: string }> {
  const base = apiBase();
  if (!base || !QUALTRICS_API_TOKEN || !surveyId || !responseId) return {};
  try {
    const res = await fetch(`${base}/surveys/${surveyId}/responses/${responseId}`, {
      headers: { 'X-API-TOKEN': QUALTRICS_API_TOKEN },
    });
    if (!res.ok) return {};
    const json = (await res.json()) as any;
    const values = json?.result?.values ?? {};

    // Email typically lives in embedded data / recipient fields.
    const email = String(
      values.email || values.RecipientEmail || values.recipientEmail || values.Q_RecipientEmail || ''
    ).toLowerCase();

    // Rating only when a specific question id is configured (it's survey-specific);
    // otherwise leave undefined rather than guessing from arbitrary fields.
    let rating: number | undefined;
    if (RATING_QID && values[RATING_QID] != null) {
      const n = Number(values[RATING_QID]);
      if (!Number.isNaN(n)) rating = n;
    }

    const completedAt = values.recordedDate || values.endDate || undefined;
    return { email: email || undefined, rating, completedAt };
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  // Optional shared-secret gate (header or ?secret=) so only Qualtrics can post.
  if (WEBHOOK_SECRET) {
    const provided =
      request.headers.get('x-qualtrics-secret') || new URL(request.url).searchParams.get('secret');
    if (provided !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;

  // Event envelope. Qualtrics uses PascalCase; accept camelCase too for local tests.
  const surveyId = String(body.SurveyID || body.surveyId || '');
  const responseId = String(body.ResponseID || body.responseId || '');
  if (!responseId) return NextResponse.json({ error: 'no responseId' }, { status: 400 });

  // Prefer values already in the payload (local tests / future payload changes),
  // else recover them from the full response.
  let email = String(body.email || body.RecipientEmail || body.values?.email || '').toLowerCase();
  let rating = typeof body.rating === 'number' ? body.rating : undefined;
  let completedAt = String(body.CompletedDate || body.completedAt || '');

  if (!email || rating === undefined || !completedAt) {
    const enriched = await enrichResponse(surveyId, responseId);
    email = email || enriched.email || '';
    rating = rating ?? enriched.rating;
    completedAt = completedAt || enriched.completedAt || new Date().toISOString();
  }

  const sentAt = body.sentAt ? String(body.sentAt) : undefined;

  // Without a tester email we can't attribute the response to anyone, so skip
  // it rather than polluting the feed with an unattributed bucket. In prod this
  // shouldn't happen: contact-list distributions carry the recipient email.
  if (!email) {
    return NextResponse.json(
      { ok: true, recorded: false, reason: 'no email resolved for response', responseId },
      { status: 202 }
    );
  }

  recordResponse({ responseId, surveyId, email, completedAt, sentAt, rating });

  // ── Re-summarize call point ───────────────────────────────────────────────
  // A new response landed → the survey's AI summary is now stale. Summaries are
  // generated on demand via POST /api/summarize (Bedrock), so the next results
  // view reflects this response. To pre-warm/cache instead, fetch the survey's
  // full responses here and call the summarizer.

  return NextResponse.json({ ok: true, responseId, enriched: !!email });
}
