import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import type { AISummary, SummarizeRequest, Tone, Severity, Priority } from './summarize';

/**
 * Bedrock summarizer — turns a survey's free-text responses into the structured
 * AISummary the results view renders.
 *
 * Production config (env):
 *   BEDROCK_MODEL_ID   e.g. anthropic.claude-3-5-sonnet-20240620-v1:0 (or a Nova model)
 *   BEDROCK_REGION     defaults to AWS_REGION, then us-east-1
 *   AWS credentials    via the default provider chain (task/instance role in prod)
 *
 * If BEDROCK_MODEL_ID is unset the route uses a computed fallback instead.
 */

const MODEL_ID = process.env.BEDROCK_MODEL_ID;
const REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';

export function bedrockConfigured(): boolean {
  return Boolean(MODEL_ID);
}

const SYSTEM_PROMPT = `You are a product analyst summarizing beta-tester survey feedback for an engineering team.
Return ONLY valid JSON (no prose, no markdown fences) matching exactly this shape:
{
  "headline": string,
  "sentiment": { "positive": number, "neutral": number, "negative": number },
  "responsesAnalyzed": number,
  "trend": string,
  "themes": [{ "title": string, "detail": string, "mentions": number, "tone": "positive"|"neutral"|"negative" }],
  "criticalIssues": [{ "issue": string, "severity": "high"|"medium"|"low", "frequency": string, "quote": string }],
  "featureRequests": [{ "request": string, "mentions": number }],
  "actions": [{ "action": string, "priority": "P0"|"P1"|"P2" }]
}
Rules: sentiment percentages are integers that sum to ~100; base all counts strictly on the provided responses; keep the headline to one sentence; omit "trend" if none is provided; prefer 2-4 themes, list only real critical issues, and make actions concrete and prioritized.`;

function buildUserMessage(req: SummarizeRequest): string {
  const lines = req.responses.map((r, i) => `${i + 1}. [${r.sentiment ?? 'unknown'}] ${r.tester}: ${r.text}`);
  return [
    `Survey: ${req.surveyTitle}`,
    `Total responses: ${req.responses.length}`,
    req.previousTrend ? `Previous wave trend: ${req.previousTrend}` : '',
    '',
    'Responses:',
    ...lines,
  ].filter(Boolean).join('\n');
}

// Pull the first balanced JSON object out of a model reply (handles stray fences/prose).
function extractJson(text: string): any {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('no JSON in model output');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const TONES: Tone[] = ['positive', 'neutral', 'negative'];
const SEVERITIES: Severity[] = ['high', 'medium', 'low'];
const PRIORITIES: Priority[] = ['P0', 'P1', 'P2'];

// Coerce the model output into a valid AISummary (defensive against missing fields).
function normalize(raw: any, req: SummarizeRequest): AISummary {
  const s = raw?.sentiment || {};
  const num = (v: any, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
  const oneOf = <T,>(v: any, allowed: T[], d: T): T => (allowed.includes(v) ? v : d);
  return {
    headline: String(raw?.headline || 'Summary generated from responses.'),
    sentiment: { positive: num(s.positive), neutral: num(s.neutral), negative: num(s.negative) },
    responsesAnalyzed: req.responses.length,
    trend: raw?.trend ? String(raw.trend) : undefined,
    themes: Array.isArray(raw?.themes) ? raw.themes.slice(0, 6).map((t: any) => ({
      title: String(t?.title || ''), detail: String(t?.detail || ''),
      mentions: num(t?.mentions), tone: oneOf<Tone>(t?.tone, TONES, 'neutral'),
    })) : [],
    criticalIssues: Array.isArray(raw?.criticalIssues) ? raw.criticalIssues.map((c: any) => ({
      issue: String(c?.issue || ''), severity: oneOf<Severity>(c?.severity, SEVERITIES, 'medium'),
      frequency: String(c?.frequency || ''), quote: c?.quote ? String(c.quote) : undefined,
    })) : [],
    featureRequests: Array.isArray(raw?.featureRequests) ? raw.featureRequests.map((f: any) => ({
      request: String(f?.request || ''), mentions: num(f?.mentions),
    })) : [],
    actions: Array.isArray(raw?.actions) ? raw.actions.map((a: any) => ({
      action: String(a?.action || ''), priority: oneOf<Priority>(a?.priority, PRIORITIES, 'P2'),
    })) : [],
  };
}

// Generic single-turn Bedrock call — shared by the summarizer and the agent.
export async function converseText(system: string, user: string, maxTokens = 1000, temperature = 0.2): Promise<string> {
  if (!MODEL_ID) throw new Error('BEDROCK_MODEL_ID not set');
  const client = new BedrockRuntimeClient({ region: REGION });
  const out = await client.send(new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: system }],
    messages: [{ role: 'user', content: [{ text: user }] }],
    inferenceConfig: { maxTokens, temperature },
  }));
  return (out.output?.message?.content || []).map((c: any) => c.text).filter(Boolean).join('');
}

export async function summarizeWithBedrock(req: SummarizeRequest): Promise<AISummary> {
  const text = await converseText(SYSTEM_PROMPT, buildUserMessage(req), 1600, 0.2);
  if (!text) throw new Error('empty model response');
  return normalize(extractJson(text), req);
}
