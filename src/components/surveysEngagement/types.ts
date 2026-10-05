// Types for the live Surveys & Engagement demo. The report is built from REAL
// Qualtrics data (survey metadata + response export), summarized generically by
// Qualtrics question type — no per-survey field mapping.

// ─── Survey list (from the live Qualtrics /surveys endpoint) ──────────────────
export interface LiveSurveyListItem {
  id: string;            // SV_… Qualtrics survey id
  name: string;
  isActive: boolean;
  lastModified?: string;
}

// ─── Milestone / phase tags (set by the beta team at bind time; UI only) ──────
export type MilestoneType = 'oobe' | 'weekly' | 'rtm' | 'exit' | 'custom';
export const MILESTONE_LABEL: Record<MilestoneType, string> = {
  oobe: 'OOBE / Setup',
  weekly: 'Weekly Performance',
  rtm: 'RTM Validation',
  exit: 'Exit Survey',
  custom: 'Custom',
};
export type Phase = 'EVT' | 'DVT' | 'PVT' | 'Beta' | 'GA';
export const PHASES: Phase[] = ['EVT', 'DVT', 'PVT', 'Beta', 'GA'];

// A survey bound into a program (demo-local; the SV_ id is the real link).
export interface BoundSurvey {
  localId: string;
  qualtricsId: string | null;   // real SV_… when bound
  name: string;
  milestone: MilestoneType;
  phase: Phase;
}
export interface DemoProgram {
  id: string;
  name: string;
  surveys: BoundSurvey[];
}

// ─── Normalized, generic report (computed server-side from live responses) ────
export type QKind = 'scale' | 'single' | 'multi' | 'text';

export interface ScaleSummary {
  id: string;
  prompt: string;
  kind: 'scale';
  n: number;
  avg: number;              // native scale
  scaleMax: number;         // inferred (5 / 10 / 100)
  avg5: number;             // normalized to a 1–5 scale
  distribution: number[];   // counts, index 0 = score 1 … (length = scaleMax when ≤10, else bucketed to 5)
  flagged: boolean;         // avg5 ≤ 3
}
export interface ChoiceSummary {
  id: string;
  prompt: string;
  kind: 'single' | 'multi';
  n: number;                // respondents who answered
  breakdown: { label: string; count: number; pct: number }[];
}
export interface TextSummary {
  id: string;
  prompt: string;
  kind: 'text';
  n: number;
  verbatims: { name: string; text: string }[];
}

export interface FlaggedResponder {
  name: string;
  email: string;
  platform?: string;
  group?: string;
  recordedDate: string;
  avg5: number;
  lowAreas: string[];       // scale prompts this responder scored ≤3 on
  verbatim?: string;        // first non-empty free-text answer they gave
}

export interface LiveReport {
  surveyId: string;
  surveyName: string;
  from: string;
  to: string;
  recipients: number;       // responses in the window (we don't know invited count from export)
  responders: number;       // same as recipients here; kept for clarity in the UI
  completed: number;
  completeRate: number;     // % finished
  overallAvg5: number | null;   // mean of per-response mean scale score, normalized /5
  flaggedCount: number;         // responders with avg5 ≤ 3
  scaleQuestions: ScaleSummary[];
  choiceQuestions: ChoiceSummary[];
  textQuestions: TextSummary[];
  flaggedResponders: FlaggedResponder[];
  platformBreakdown: { label: string; count: number; pct: number }[];
  source: 'live' | 'seed';
  notice?: string;          // populated when we fell back to seed (why)
}
