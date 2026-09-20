// Types for the Programs feature (Surveys / Engagement / Program Health / roster).
// Extracted from ProgramsView.tsx so the shapes are easy to find in one place.

export type ProgramType = 'hardware' | 'feature';
export type SurveyStatus = 'published' | 'draft' | 'closed';
export type QuestionType = 'rating' | 'multiple_choice' | 'yes_no' | 'text';
export type TechnicalLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// A program is a long-lived container; it accumulates MANY surveys over its life.
// Each survey has a kind (what it asks) and a cadence (recurring pulse vs one-off).
// OOBE/Setup + Packaging = first-impression front-load; Performance = the longitudinal
// experiential pulse (survey-based, NOT lab/benchmark perf); RTM = production-unit validation.
export type SurveyKind = 'oobe' | 'packaging' | 'performance' | 'rtm' | 'resetup' | 'final' | 'custom';
export type Cadence = 'recurring' | 'one_off';
// Hardware programs run the full survey cycle once per phase (EVT → DVT → PVT).
// Feature/software programs have no phase.
export type Phase = 'EVT' | 'DVT' | 'PVT';

export interface DemoQuestion {
  id: string;
  type: QuestionType;
  title: string;
  // rating: counts per 1..5 ; multiple_choice: label->count ; yes_no: [yes,no] ; text: strings
  ratingCounts?: number[];
  choiceCounts?: { label: string; count: number }[];
  yesNo?: { yes: number; no: number };
  textResponses?: { tester: string; text: string; sentiment: 'positive' | 'neutral' | 'negative' }[];
}

// A "wave" (a.k.a. run) is ONE collection cycle of a survey. Recurring surveys
// (the weekly Performance pulse) accumulate many waves over a phase; a one-off
// survey has a single wave.
export interface SurveyWave {
  id: string;
  label: string;        // "Wave 4"
  date: string;         // ISO date the wave was sent, e.g. "2026-09-08"
  responses: number;
  recipients: number;
  resumedNote?: string; // e.g. "Resumed after RTM testing"
}

export interface DemoSurvey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  qualtricsId: string;
  programId: string;
  programName: string;
  programType: ProgramType;
  kind: SurveyKind;
  cadence: Cadence;
  phase?: Phase;                   // hardware only; undefined for feature/software
  audienceFilter?: TechnicalLevel; // e.g. targeted only Advanced testers
  recipients: number;
  responses: number;               // = latest wave's responses (kept in sync for cards/stats)
  avgCompletionMins: number;
  ranOn?: string;                  // one-off surveys: the single date it ran (ISO)
  waves?: SurveyWave[];            // recurring surveys: the wave history (newest last)
  questions: DemoQuestion[];       // aggregated for the LATEST wave (demo simplification)
}

export interface DemoTester {
  id: string;
  name: string;
  email: string;
  programName: string;
  technicalLevel: TechnicalLevel;
  reliability: number;        // 0-100 : % of surveys responded to
  avgResponseDays: number;    // avg days sent -> completed
  feedbackQuality: number;    // 1-5
  deviceOnline: boolean | null; // null = feature program (no device)
  missedSurveys: number;
  noSeedDevice?: boolean;     // roster filler — never gets a seeded device (keeps device counts unchanged)
}

export interface DemoProgram {
  id: string;
  name: string;
  type: ProgramType;
  status: 'active' | 'completed'; // 'completed' = the beta is over (closed, kept for the record)
  closedAt?: string;          // when the program was closed (drives the archived-devices record)
  currentPhase?: Phase;       // hardware only — the phase currently running
  audienceSize: number;       // testers imported from Qualtrics — the survey audience for this program
  devicesDeployed: number;    // 0 for feature programs
  devicesOnline: number;
  surveyResponseRate: number; // 0-100
  avgFeedbackQuality: number; // 1-5
  testers: DemoTester[];
}

// ── Identity-match roster (email → network → beta-model DSN) ──────────────────
export type MatchState = 'matched' | 'multiple' | 'unmatched';

export interface RosterCandidate {
  serial: string; // the DSN
  model: string;  // beta model — what the auto-filter narrows on
  online: boolean;
}

export interface RosterEntry {
  id: string;
  tester: string;
  email: string;             // eero-account email — the match key
  match: MatchState;
  candidates: RosterCandidate[]; // beta-model eeros found on their network
  selectedSerial?: string;       // the chosen DSN (set when matched)
}

// ── Assigned-device model (serial↔tester pairing, enriched via /api/insight) ──
export type DeviceLiveStatus = 'online' | 'offline' | 'pending'; // pending = assigned, not yet on a network

export interface AssignedDevice {
  serial: string;
  model: string;
  networkId: string | null;   // Insight network the unit lives on (null until it activates)
  status: DeviceLiveStatus;
  firmware: string;
  source: 'live' | 'seed';
}
