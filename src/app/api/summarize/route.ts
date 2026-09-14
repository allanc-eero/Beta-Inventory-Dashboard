import { NextRequest, NextResponse } from 'next/server';
import { bedrockConfigured, summarizeWithBedrock } from '@/lib/bedrock';
import type { AISummary, SummarizeRequest, Tone } from '@/lib/summarize';

/**
 * AI feedback summary. Uses Bedrock when BEDROCK_MODEL_ID is configured; otherwise
 * returns a deterministic computed summary from the responses so the UI still
 * works. Same fallback pattern as /api/insight and /api/breadboard.
 */

function computedFallback(req: SummarizeRequest): AISummary {
  const total = req.responses.length || 1;
  const count = (t: Tone) => req.responses.filter((r) => r.sentiment === t).length;
  const pos = count('positive'); const neg = count('negative');
  const neu = req.responses.filter((r) => !r.sentiment || r.sentiment === 'neutral').length;
  const pct = (n: number) => Math.round((n / total) * 100);
  const negatives = req.responses.filter((r) => r.sentiment === 'negative');
  return {
    headline: `${req.responses.length} responses analyzed — ${pct(pos)}% positive, ${pct(neg)}% flag issues. (Bedrock not configured; computed summary.)`,
    sentiment: { positive: pct(pos), neutral: pct(neu), negative: pct(neg) },
    responsesAnalyzed: req.responses.length,
    themes: [
      ...(pos ? [{ title: 'Positive feedback', detail: `${pos} response(s) expressed satisfaction.`, mentions: pos, tone: 'positive' as Tone }] : []),
      ...(neg ? [{ title: 'Reported problems', detail: `${neg} response(s) raised issues to review.`, mentions: neg, tone: 'negative' as Tone }] : []),
    ],
    criticalIssues: negatives.slice(0, 3).map((r) => ({
      issue: r.text.slice(0, 140), severity: 'medium' as const, frequency: '—', quote: `“${r.text}”`,
    })),
    featureRequests: [],
    actions: negatives.length
      ? [{ action: `Review ${negatives.length} flagged response(s) and file bugs as needed`, priority: 'P1' as const }]
      : [{ action: 'No action needed — no issues flagged', priority: 'P2' as const }],
  };
}

export async function POST(request: NextRequest) {
  const req = (await request.json().catch(() => null)) as SummarizeRequest | null;
  if (!req || !Array.isArray(req.responses)) {
    return NextResponse.json({ error: 'responses[] required' }, { status: 400 });
  }

  if (!bedrockConfigured()) {
    return NextResponse.json(computedFallback(req));
  }

  try {
    const summary = await summarizeWithBedrock(req);
    return NextResponse.json(summary);
  } catch (err: any) {
    // On any Bedrock failure, fall back to the computed summary so the UI never breaks.
    console.error('[summarize] Bedrock error:', err?.message);
    return NextResponse.json(computedFallback(req));
  }
}
