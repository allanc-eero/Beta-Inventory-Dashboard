/**
 * AI feedback-summary seam — the boundary between the survey results view and
 * the Bedrock summarizer.
 *
 * Flow: results view collects a survey's text responses → POST /api/summarize →
 * Bedrock returns a structured briefing (or a computed fallback) → the view
 * renders it. When SUMMARIZE_LIVE is off, the view keeps its canned summaries.
 */

export type Tone = 'positive' | 'neutral' | 'negative';
export type Severity = 'high' | 'medium' | 'low';
export type Priority = 'P0' | 'P1' | 'P2';

export interface AISummary {
  headline: string;                                     // one-line TL;DR
  sentiment: { positive: number; neutral: number; negative: number }; // % (sum ~100)
  responsesAnalyzed: number;
  trend?: string;                                       // vs previous wave (recurring surveys)
  themes: { title: string; detail: string; mentions: number; tone: Tone }[];
  criticalIssues: { issue: string; severity: Severity; frequency: string; quote?: string }[];
  featureRequests: { request: string; mentions: number }[];
  actions: { action: string; priority: Priority }[];
}

// A single free-text response fed to the summarizer.
export interface SummaryResponseInput {
  tester: string;
  text: string;
  sentiment?: Tone;
}

export interface SummarizeRequest {
  surveyId: string;
  surveyTitle: string;
  responses: SummaryResponseInput[];
  previousTrend?: string; // for recurring surveys, the prior wave's trend note
}

// Flip on to generate real summaries via Bedrock; off keeps the canned demo ones.
export const SUMMARIZE_LIVE = process.env.NEXT_PUBLIC_AI_SUMMARY === 'bedrock';

export async function fetchSummary(req: SummarizeRequest): Promise<AISummary> {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`summarize ${res.status}`);
  return res.json();
}
