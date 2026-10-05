// Server-only Qualtrics client for the Surveys & Engagement demo.
// Pulls REAL survey metadata + response exports and summarizes them generically
// by Qualtrics question type. Never imported by client code (keeps the API
// token server-side). Mirrors the auth/env/fallback pattern of
// /api/demo-qualtrics-lists.
import { inflateRawSync, gunzipSync } from 'zlib';
import type {
  LiveSurveyListItem, LiveReport, ScaleSummary, ChoiceSummary, TextSummary, FlaggedResponder,
} from '@/components/surveysEngagement/types';

const BASE = process.env.QUALTRICS_BASE_URL;
const TOKEN = process.env.QUALTRICS_API_TOKEN;
const headers = { 'X-API-TOKEN': TOKEN || '', 'Content-Type': 'application/json' };

export const canCallLive = Boolean(BASE && TOKEN);

// ─── Low-level fetch helpers ──────────────────────────────────────────────────
async function qFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Qualtrics ${res.status} on ${path}`);
  return res.json();
}

// List active surveys (paginated).
export async function listSurveys(): Promise<LiveSurveyListItem[]> {
  const out: LiveSurveyListItem[] = [];
  let path: string | null = '/surveys';
  let guard = 0;
  while (path && guard++ < 20) {
    const data: any = await qFetch(path);
    for (const el of data.result?.elements || []) {
      out.push({ id: el.id, name: el.name, isActive: !!el.isActive, lastModified: el.lastModified });
    }
    const next: string | null = data.result?.nextPage || null;
    path = next ? next.substring(next.indexOf('/surveys')) : null;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

interface QMeta { id: string; type: string; selector: string; text: string; choices: Record<string, string>; }

// Metadata for the ~active/exported questions of a survey.
async function getQuestionMeta(surveyId: string): Promise<{ name: string; questions: Record<string, QMeta> }> {
  const data = await qFetch(`/surveys/${surveyId}`);
  const q = data.result?.questions || {};
  const questions: Record<string, QMeta> = {};
  for (const [qid, raw] of Object.entries<any>(q)) {
    const choices: Record<string, string> = {};
    for (const [rc, c] of Object.entries<any>(raw.choices || {})) choices[rc] = stripHtml(c.choiceText || c.description || rc);
    questions[qid] = {
      id: qid,
      type: raw.questionType?.type || '',
      selector: raw.questionType?.selector || '',
      text: stripHtml(raw.questionText || qid),
      choices,
    };
  }
  return { name: data.result?.name || surveyId, questions };
}

// Async response export → gunzipped JSON { responses: [...] }.
async function exportResponses(surveyId: string, from: string, to: string): Promise<any[]> {
  const start = await qFetch(`/surveys/${surveyId}/export-responses`, {
    method: 'POST',
    body: JSON.stringify({ format: 'json', startDate: `${from}T00:00:00Z`, endDate: `${to}T23:59:59Z` }),
  });
  const progressId = start.result?.progressId;
  if (!progressId) throw new Error('no progressId');

  let fileId: string | null = null;
  for (let i = 0; i < 60 && !fileId; i++) {
    const prog = await qFetch(`/surveys/${surveyId}/export-responses/${progressId}`);
    const status = prog.result?.status;
    if (status === 'complete') { fileId = prog.result?.fileId; break; }
    if (status === 'failed') throw new Error('export failed');
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!fileId) throw new Error('export timed out');

  // The file endpoint returns a ZIP archive containing one JSON file.
  const res = await fetch(`${BASE}/surveys/${surveyId}/export-responses/${fileId}/file`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Qualtrics ${res.status} on file`);
  const buf = Buffer.from(await res.arrayBuffer());
  const text = decompress(buf);
  return JSON.parse(text).responses || [];
}

// Decompress the export payload. Qualtrics returns a ZIP (PK\x03\x04); some
// gateways return gzip or plain JSON — handle all three.
function decompress(buf: Buffer): string {
  if (buf[0] === 0x50 && buf[1] === 0x4b) return unzipFirstEntry(buf);      // "PK" → ZIP
  if (buf[0] === 0x1f && buf[1] === 0x8b) return gunzipSync(buf).toString('utf8'); // gzip
  return buf.toString('utf8');                                              // already JSON
}

// Minimal ZIP reader: extract the first entry via the central directory.
function unzipFirstEntry(buf: Buffer): string {
  // Find End Of Central Directory record (sig 0x06054b50), scanning from the end.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip: no EOCD');
  const cdOffset = buf.readUInt32LE(eocd + 16);

  // First central directory file header (sig 0x02014b50).
  if (buf.readUInt32LE(cdOffset) !== 0x02014b50) throw new Error('zip: bad central dir');
  const method = buf.readUInt16LE(cdOffset + 10);
  const compSize = buf.readUInt32LE(cdOffset + 20);
  const localOffset = buf.readUInt32LE(cdOffset + 42);

  // Local file header (sig 0x04034b50) → compute where the data starts.
  if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('zip: bad local header');
  const lNameLen = buf.readUInt16LE(localOffset + 26);
  const lExtraLen = buf.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + lNameLen + lExtraLen;
  const data = buf.subarray(dataStart, dataStart + compSize);
  const out = method === 8 ? inflateRawSync(data) : data; // 8 = deflate, 0 = stored
  return out.toString('utf8');
}

// ─── Public: build a live report for a survey + date window ───────────────────
// Short-lived in-memory cache so repeated "Generate" clicks (same survey + same
// window) reuse one export instead of re-running the slow export each time.
const CACHE_TTL = 5 * 60 * 1000;
const reportCache = new Map<string, { at: number; report: LiveReport }>();

export async function buildLiveReport(surveyId: string, from: string, to: string): Promise<LiveReport> {
  const key = `${surveyId}|${from}|${to}`;
  const hit = reportCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.report;

  const [{ name, questions }, responses] = await Promise.all([
    getQuestionMeta(surveyId),
    exportResponses(surveyId, from, to),
  ]);
  const report = summarize(surveyId, name, from, to, questions, responses, 'live');

  reportCache.set(key, { at: Date.now(), report });
  if (reportCache.size > 100) reportCache.delete(reportCache.keys().next().value as string); // simple bound
  return report;
}

// ─── Generic, type-driven summarizer (pure) ───────────────────────────────────
export function summarize(
  surveyId: string, surveyName: string, from: string, to: string,
  questions: Record<string, QMeta>, responses: any[], source: 'live' | 'seed',
): LiveReport {
  const metas = Object.values(questions);
  const scaleMetas = metas.filter((m) => m.type === 'Slider' || m.type === 'NPS');
  const singleMetas = metas.filter((m) => m.type === 'MC' && !isMulti(m));
  const multiMetas = metas.filter((m) => m.type === 'MC' && isMulti(m));
  const textMetas = metas.filter((m) => m.type === 'TE' && m.selector !== 'FORM');

  const nameOf = (v: any) => {
    const n = `${v.recipientFirstName || ''} ${v.recipientLastName || ''}`.trim();
    return n || v.recipientEmail || 'Anonymous';
  };

  // ── Scale questions ──
  const scaleQuestions: ScaleSummary[] = scaleMetas.map((m) => {
    const key = `${m.id}_1`;
    const vals = responses.map((r) => r.values[key]).filter((x) => typeof x === 'number') as number[];
    const n = vals.length;
    const observedMax = vals.reduce((a, b) => Math.max(a, b), 0);
    const scaleMax = observedMax <= 5 ? 5 : observedMax <= 10 ? 10 : 100;
    const avg = n ? vals.reduce((a, b) => a + b, 0) / n : 0;
    const avg5 = scaleMax === 5 ? avg : (avg / scaleMax) * 5;
    const buckets = scaleMax <= 10 ? scaleMax : 5;
    const distribution = new Array(buckets).fill(0);
    for (const v of vals) {
      const idx = scaleMax <= 10 ? Math.min(buckets - 1, Math.max(0, Math.round(v) - 1)) : Math.min(buckets - 1, Math.floor((v / scaleMax) * buckets));
      distribution[idx]++;
    }
    return { id: m.id, prompt: m.text, kind: 'scale' as const, n, avg: round1(avg), scaleMax, avg5: round1(avg5), distribution, flagged: n > 0 && avg5 <= 3 };
  }).filter((s) => s.n > 0);

  // ── Single-choice ──
  const choiceQuestions: ChoiceSummary[] = [];
  for (const m of singleMetas) {
    const counts = new Map<string, number>();
    let n = 0;
    for (const r of responses) {
      const lab = r.labels?.[m.id];
      const val = r.values?.[m.id];
      const label = typeof lab === 'string' ? lab : (val != null ? m.choices[String(val)] : undefined);
      if (!label) continue;
      counts.set(label, (counts.get(label) || 0) + 1); n++;
    }
    if (n > 0) choiceQuestions.push({ id: m.id, prompt: m.text, kind: 'single', n, breakdown: toBreakdown(counts, n) });
  }
  // ── Multi-choice ──
  for (const m of multiMetas) {
    const counts = new Map<string, number>();
    const respondents = new Set<number>();
    responses.forEach((r, i) => {
      for (const [k, v] of Object.entries<any>(r.values || {})) {
        const mm = k.match(new RegExp(`^${m.id}_(\\d+)$`));
        if (!mm || v == null || v === '') continue;
        const label = r.labels?.[k] || m.choices[mm[1]] || `Option ${mm[1]}`;
        counts.set(label, (counts.get(label) || 0) + 1); respondents.add(i);
      }
    });
    const n = respondents.size;
    if (n > 0) choiceQuestions.push({ id: m.id, prompt: m.text, kind: 'multi', n, breakdown: toBreakdown(counts, n) });
  }

  // ── Free text ──
  const textQuestions: TextSummary[] = textMetas.map((m) => {
    const verbatims: { name: string; text: string }[] = [];
    for (const r of responses) {
      const t = r.values?.[`${m.id}_TEXT`];
      if (typeof t === 'string' && t.trim().length > 1) verbatims.push({ name: nameOf(r.values), text: t.trim() });
    }
    return { id: m.id, prompt: m.text, kind: 'text' as const, n: verbatims.length, verbatims: verbatims.slice(0, 25) };
  }).filter((t) => t.n > 0);

  // ── Per-response overall + flagged responders ──
  const scaleKeys = scaleQuestions.map((s) => ({ key: `${s.id}_1`, prompt: s.prompt, scaleMax: s.scaleMax }));
  const perResp: number[] = [];
  const flaggedResponders: FlaggedResponder[] = [];
  for (const r of responses) {
    const scores: number[] = [];
    const low: string[] = [];
    for (const sk of scaleKeys) {
      const v = r.values?.[sk.key];
      if (typeof v !== 'number') continue;
      const s5 = sk.scaleMax === 5 ? v : (v / sk.scaleMax) * 5;
      scores.push(s5);
      if (s5 <= 3) low.push(sk.prompt);
    }
    if (!scores.length) continue;
    const avg5 = scores.reduce((a, b) => a + b, 0) / scores.length;
    perResp.push(avg5);
    if (avg5 <= 3) {
      const firstText = textMetas.map((m) => r.values?.[`${m.id}_TEXT`]).find((t) => typeof t === 'string' && t.trim().length > 1);
      flaggedResponders.push({
        name: nameOf(r.values), email: r.values?.recipientEmail || '',
        platform: r.values?.['App Type'], group: r.values?.['Network Group'],
        recordedDate: (r.values?.recordedDate || '').slice(0, 10),
        avg5: round1(avg5), lowAreas: Array.from(new Set(low)),
        verbatim: typeof firstText === 'string' ? firstText.trim() : undefined,
      });
    }
  }
  flaggedResponders.sort((a, b) => a.avg5 - b.avg5);

  // ── Platform breakdown (embedded data; "App Type" has some junk values) ──
  const plat = new Map<string, number>();
  let platN = 0;
  for (const r of responses) {
    let p = r.values?.['App Type'];
    if (typeof p !== 'string' || !p) continue;
    if (p.includes('@') || p.length > 15) p = 'Other'; // stray emails / free text
    plat.set(p, (plat.get(p) || 0) + 1); platN++;
  }

  const completed = responses.filter((r) => r.values?.finished === 1 || r.values?.finished === true).length;
  const overallAvg5 = perResp.length ? round1(perResp.reduce((a, b) => a + b, 0) / perResp.length) : null;

  return {
    surveyId, surveyName, from, to,
    recipients: responses.length, responders: responses.length,
    completed, completeRate: responses.length ? Math.round((completed / responses.length) * 100) : 0,
    overallAvg5, flaggedCount: flaggedResponders.length,
    // Highest-signal questions first (betas have many sparse branching questions).
    scaleQuestions: scaleQuestions.sort((a, b) => b.n - a.n),
    choiceQuestions: choiceQuestions.sort((a, b) => b.n - a.n),
    textQuestions: textQuestions.sort((a, b) => b.n - a.n),
    flaggedResponders: flaggedResponders.slice(0, 30),
    platformBreakdown: toBreakdown(plat, platN),
    source,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function isMulti(m: QMeta) { return m.selector === 'MAVR' || m.selector === 'MACOL' || m.selector === 'MSB'; }
function round1(n: number) { return Math.round(n * 10) / 10; }
function stripHtml(s: string) { return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }
function toBreakdown(counts: Map<string, number>, n: number, cap = 8) {
  const sorted = Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, pct: n ? Math.round((count / n) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
  if (sorted.length <= cap) return sorted;
  const head = sorted.slice(0, cap);
  const rest = sorted.slice(cap).reduce((s, x) => s + x.count, 0);
  head.push({ label: `+${sorted.length - cap} more`, count: rest, pct: n ? Math.round((rest / n) * 100) : 0 });
  return head;
}
