'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO: Surveys + Engagement + Program Health  (flagship preview)
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-contained preview route at /demo-surveys. Touches NOTHING in the real app:
 * all types, mock data, and components live in this one file. Once approved, the
 * pieces get promoted into src/types, src/store, and src/components.
 *
 * What it shows (the flagship loop we scoped):
 *   1. Surveys      — list + results (charts + AI feedback summary + closed-loop
 *                     "create JIRA ticket" from a response). Qualtrics-backed seam.
 *   2. Engagement   — reliability / response-time / feedback-quality on testers,
 *                     plus an At-Risk view (rules engine + AI narration).
 *   3. Program Health — the leadership report: deployed, % online, response rate,
 *                     feedback quality per program (Hardware AND Feature programs).
 *
 * Everything marked "simulated" is the same demo seam pattern the app already uses
 * (setTimeout instead of a live API). Real Qualtrics/Bedrock swap in behind these.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Card, Button, Tag, Segmented, Select, ProgressBar, Input, Modal,
  Icon, ICONS, TableV2, ToastProvider, useToast, ToastType,
} from '@amzn/eero-web-design-components';

// ─── Types (inline — demo only) ──────────────────────────────────────────────
type ProgramType = 'hardware' | 'feature';
type SurveyStatus = 'published' | 'draft' | 'closed';
type QuestionType = 'rating' | 'multiple_choice' | 'yes_no' | 'text';
type TechnicalLevel = 'Beginner' | 'Intermediate' | 'Advanced';
// A program is a long-lived container; it accumulates MANY surveys over its life.
// Each survey has a kind (what it asks) and a cadence (recurring pulse vs one-off).
// OOBE/Setup + Packaging = first-impression front-load; Performance = the longitudinal
// experiential pulse (survey-based, NOT lab/benchmark perf); RTM = production-unit validation.
// Recruiting is handled in Qualtrics upstream and is not charted here.
type SurveyKind = 'oobe' | 'packaging' | 'performance' | 'rtm' | 'resetup' | 'final' | 'custom';
type Cadence = 'recurring' | 'one_off';
// Hardware programs run the full survey cycle once per phase (EVT → DVT → PVT).
// Feature/software programs have no phase.
type Phase = 'EVT' | 'DVT' | 'PVT';

interface DemoQuestion {
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
// survey has a single wave. Nothing is ever deleted — the app just shows the
// LATEST wave by default and keeps the history one click away. `resumedNote`
// marks a wave that picked back up after the pulse was paused (e.g. for RTM),
// so the gap in the timeline explains itself instead of looking like a bug.
interface SurveyWave {
  id: string;
  label: string;        // "Wave 4"
  date: string;         // ISO date the wave was sent, e.g. "2026-09-08"
  responses: number;
  recipients: number;
  resumedNote?: string; // e.g. "Resumed after RTM testing"
}

interface DemoSurvey {
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

interface DemoTester {
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
}

interface DemoProgram {
  id: string;
  name: string;
  type: ProgramType;
  status: 'active' | 'completed'; // 'completed' = the beta is over (closed, kept for the record)
  currentPhase?: Phase;       // hardware only — the phase currently running
  audienceSize: number;       // testers imported from Qualtrics — the survey audience for this program
  devicesDeployed: number;    // 0 for feature programs
  devicesOnline: number;
  surveyResponseRate: number; // 0-100
  avgFeedbackQuality: number; // 1-5
}

// Survey-kind metadata: label, default title + cadence. Drives the pickers and tags.
const SURVEY_KINDS: Record<SurveyKind, { label: string; defaultTitle: string; defaultCadence: Cadence }> = {
  oobe:        { label: 'OOBE / Setup',         defaultTitle: 'Setup Experience',   defaultCadence: 'one_off' },
  packaging:   { label: 'Packaging / Unboxing', defaultTitle: 'Packaging Feedback', defaultCadence: 'one_off' },
  performance: { label: 'Weekly experience',    defaultTitle: 'Weekly Check-in',    defaultCadence: 'recurring' },
  rtm:         { label: 'RTM testing',          defaultTitle: 'RTM Validation',     defaultCadence: 'one_off' },
  resetup:     { label: 'Re-setup',             defaultTitle: 'Re-setup Test',      defaultCadence: 'one_off' },
  final:       { label: 'Final Summary',        defaultTitle: 'Final Summary',      defaultCadence: 'one_off' },
  custom:      { label: 'Custom',               defaultTitle: '',                   defaultCadence: 'one_off' },
};

const PHASES: Phase[] = ['EVT', 'DVT', 'PVT'];

// ─── Seed data (realistic — so the demo tells a story) ───────────────────────
// INITIAL_* seed page-level state so newly-created programs/surveys show up live.
const INITIAL_SURVEYS: DemoSurvey[] = [
  {
    id: 'sv-foghorn-setup',
    title: 'Foghorn Firmware 7.2 — Setup Experience',
    description: 'First-run feedback on the 7.2 firmware setup flow. Feature beta — no hardware shipped.',
    status: 'published',
    qualtricsId: 'SV_3Kx9aFghorn72',
    programId: 'pg-foghorn-fw',
    programName: 'Foghorn Firmware Beta',
    programType: 'feature',
    kind: 'oobe',
    cadence: 'one_off',
    audienceFilter: 'Advanced',
    recipients: 48,
    responses: 41,
    avgCompletionMins: 4,
    questions: [
      {
        id: 'q1', type: 'rating', title: 'How easy was the 7.2 update to install?',
        ratingCounts: [1, 2, 5, 15, 18],
      },
      {
        id: 'q2', type: 'multiple_choice', title: 'Which step took the longest?',
        choiceCounts: [
          { label: 'Download', count: 6 },
          { label: 'Reboot / re-provision', count: 22 },
          { label: 'Reconnecting devices', count: 9 },
          { label: 'Nothing — it was fast', count: 4 },
        ],
      },
      {
        id: 'q3', type: 'yes_no', title: 'Did any device drop off the network after the update?',
        yesNo: { yes: 11, no: 30 },
      },
      {
        id: 'q4', type: 'text', title: 'Anything we should fix about the update flow?',
        textResponses: [
          { tester: 'D. Kim', text: 'Reboot took ~6 minutes and the app showed no progress — I thought it had bricked. A progress bar would fix this.', sentiment: 'negative' },
          { tester: 'A. Rivera', text: 'Smooth. Loved that my settings carried over.', sentiment: 'positive' },
          { tester: 'J. Bell', text: 'One wired device needed a manual reconnect after reboot.', sentiment: 'neutral' },
          { tester: 'L. Hill', text: 'The 6E band disappeared until I power-cycled the gateway. Repeatable on my unit.', sentiment: 'negative' },
        ],
      },
    ],
  },
  {
    id: 'sv-merci-weekly',
    title: 'Merci Beta — Weekly Check-in',
    description: 'Recurring pulse on stability and coverage for the Merci hardware beta cohort.',
    status: 'published',
    qualtricsId: 'SV_8Lm2MerciWk',
    programId: 'pg-merci-beta',
    programName: 'Merci Beta',
    programType: 'hardware',
    kind: 'performance',
    cadence: 'recurring',
    phase: 'DVT',
    recipients: 62,
    responses: 39,
    avgCompletionMins: 3,
    // Recurring pulse: waves 1-3 ran weekly, then the pulse PAUSED while RTM
    // validation ran (see sv-merci-rtm below), then resumed as wave 4. The gap
    // between Aug 18 and Sep 8 is the RTM detour — and it shows on the timeline.
    waves: [
      { id: 'w1', label: 'Wave 1', date: '2026-08-04', responses: 44, recipients: 62 },
      { id: 'w2', label: 'Wave 2', date: '2026-08-11', responses: 41, recipients: 62 },
      { id: 'w3', label: 'Wave 3', date: '2026-08-18', responses: 38, recipients: 62 },
      { id: 'w4', label: 'Wave 4', date: '2026-09-08', responses: 39, recipients: 62, resumedNote: 'Resumed after RTM testing' },
    ],
    questions: [
      {
        id: 'q1', type: 'rating', title: 'How would you rate your whole-home coverage this week?',
        ratingCounts: [2, 3, 8, 17, 9],
      },
      {
        id: 'q2', type: 'yes_no', title: 'Did you experience any drops or disconnects?',
        yesNo: { yes: 14, no: 25 },
      },
      {
        id: 'q3', type: 'multiple_choice', title: 'Where did coverage feel weakest?',
        choiceCounts: [
          { label: 'Backyard / outdoor', count: 16 },
          { label: 'Basement', count: 11 },
          { label: 'Upstairs bedrooms', count: 7 },
          { label: 'No weak spots', count: 5 },
        ],
      },
      {
        id: 'q4', type: 'text', title: 'Tell us about any issue you hit this week.',
        textResponses: [
          { tester: 'P. Rivera', text: 'Backyard node keeps dropping to 2.4GHz. Speeds tank when it does.', sentiment: 'negative' },
          { tester: 'S. Thorum', text: 'Rock solid all week, no complaints.', sentiment: 'positive' },
          { tester: 'M. Mullin', text: 'One reboot on Tuesday around 2am, came back on its own.', sentiment: 'neutral' },
        ],
      },
    ],
  },
  {
    id: 'sv-merci-rtm',
    title: 'Merci Beta — RTM Validation',
    description: 'Production-unit validation run mid-DVT. The weekly pulse paused while this ran, then resumed as Wave 4.',
    status: 'closed',
    qualtricsId: 'SV_9Rt3MerciRTM',
    programId: 'pg-merci-beta',
    programName: 'Merci Beta',
    programType: 'hardware',
    kind: 'rtm',
    cadence: 'one_off',
    phase: 'DVT',
    recipients: 62,
    responses: 51,
    avgCompletionMins: 6,
    ranOn: '2026-08-27', // ran in the gap between weekly waves 3 and 4
    questions: [
      { id: 'q1', type: 'yes_no', title: 'Did your production unit pass its self-test on first boot?', yesNo: { yes: 47, no: 4 } },
      { id: 'q2', type: 'rating', title: 'How does this production unit compare to your earlier EVT/DVT unit?', ratingCounts: [0, 2, 6, 21, 22] },
      {
        id: 'q3', type: 'multiple_choice', title: 'Any cosmetic or hardware defects on the production unit?',
        choiceCounts: [
          { label: 'None', count: 41 },
          { label: 'Minor cosmetic', count: 7 },
          { label: 'Port / connector issue', count: 2 },
          { label: 'Other', count: 1 },
        ],
      },
    ],
  },
  {
    id: 'sv-outdoor-coverage',
    title: 'Outdoor Dogfood — Coverage Feedback',
    description: 'Coverage and mounting feedback for the outdoor dogfood program.',
    status: 'closed',
    qualtricsId: 'SV_0Qz1OutdrCv',
    programId: 'pg-outdoor-df',
    programName: 'Outdoor Dogfood',
    programType: 'hardware',
    kind: 'oobe',
    cadence: 'one_off',
    recipients: 30,
    responses: 27,
    avgCompletionMins: 5,
    questions: [
      { id: 'q1', type: 'rating', title: 'How satisfied are you with outdoor coverage?', ratingCounts: [0, 1, 4, 12, 10] },
      { id: 'q2', type: 'yes_no', title: 'Was the mounting hardware sufficient?', yesNo: { yes: 22, no: 5 } },
    ],
  },
  {
    id: 'sv-app-redesign',
    title: 'App Redesign — Concept Test',
    description: 'Draft concept test for the redesigned app home screen. Not yet distributed.',
    status: 'draft',
    qualtricsId: 'SV_draftAppRedesign',
    programId: 'pg-app-beta',
    programName: 'App Experience Beta',
    programType: 'feature',
    kind: 'custom',
    cadence: 'one_off',
    recipients: 0,
    responses: 0,
    avgCompletionMins: 0,
    questions: [
      { id: 'q1', type: 'rating', title: 'How appealing is the new home screen?', ratingCounts: [0, 0, 0, 0, 0] },
    ],
  },
];

const TESTERS: DemoTester[] = [
  { id: 't1', name: 'Diego Kim', email: 'diego.kim@eero.com', programName: 'Foghorn Firmware Beta', technicalLevel: 'Advanced', reliability: 92, avgResponseDays: 1.2, feedbackQuality: 5, deviceOnline: null, missedSurveys: 0 },
  { id: 't2', name: 'Aaron Rivera', email: 'aaron@eero.com', programName: 'Merci Beta', technicalLevel: 'Intermediate', reliability: 78, avgResponseDays: 2.4, feedbackQuality: 4, deviceOnline: true, missedSurveys: 1 },
  { id: 't3', name: 'Philip Rivera', email: 'philip.rivera@eero.com', programName: 'Merci Beta', technicalLevel: 'Advanced', reliability: 64, avgResponseDays: 3.1, feedbackQuality: 4, deviceOnline: true, missedSurveys: 2 },
  { id: 't4', name: 'Layton Hill', email: 'layton.hill@eero.com', programName: 'Foghorn Firmware Beta', technicalLevel: 'Advanced', reliability: 88, avgResponseDays: 1.6, feedbackQuality: 5, deviceOnline: null, missedSurveys: 0 },
  { id: 't5', name: 'Matthew Mullin', email: 'matthew.mullin@eero.com', programName: 'Merci Beta', technicalLevel: 'Beginner', reliability: 25, avgResponseDays: 9.0, feedbackQuality: 2, deviceOnline: false, missedSurveys: 4 },
  { id: 't6', name: 'John Pelebo', email: 'john.pelebo@eero.com', programName: 'Outdoor Dogfood', technicalLevel: 'Intermediate', reliability: 18, avgResponseDays: 12.0, feedbackQuality: 1, deviceOnline: false, missedSurveys: 5 },
  { id: 't7', name: 'Stacia Wong', email: 'stacia@eero.com', programName: 'Outdoor Dogfood', technicalLevel: 'Advanced', reliability: 95, avgResponseDays: 0.9, feedbackQuality: 5, deviceOnline: true, missedSurveys: 0 },
  { id: 't8', name: 'Lalitha Rao', email: 'lalitha@eero.com', programName: 'Merci Beta', technicalLevel: 'Intermediate', reliability: 29, avgResponseDays: 8.2, feedbackQuality: 2, deviceOnline: false, missedSurveys: 3 },
];

const INITIAL_PROGRAMS: DemoProgram[] = [
  { id: 'pg-merci-beta', name: 'Merci Beta', type: 'hardware', status: 'active', currentPhase: 'DVT', audienceSize: 62, devicesDeployed: 62, devicesOnline: 51, surveyResponseRate: 63, avgFeedbackQuality: 3.8 },
  { id: 'pg-outdoor-df', name: 'Outdoor Dogfood', type: 'hardware', status: 'completed', currentPhase: 'PVT', audienceSize: 30, devicesDeployed: 30, devicesOnline: 22, surveyResponseRate: 90, avgFeedbackQuality: 4.4 },
  { id: 'pg-foghorn-fw', name: 'Foghorn Firmware Beta', type: 'feature', status: 'active', audienceSize: 48, devicesDeployed: 0, devicesOnline: 0, surveyResponseRate: 85, avgFeedbackQuality: 4.6 },
  { id: 'pg-app-beta', name: 'App Experience Beta', type: 'feature', status: 'active', audienceSize: 24, devicesDeployed: 0, devicesOnline: 0, surveyResponseRate: 0, avgFeedbackQuality: 0 },
];

// ─── Per-program device roster — the Insight identity-match surface ──────────
// PRODUCTION MODEL (simulated here behind the same demo seam as everything else):
//   Qualtrics roster (tester + eero-account email)
//     → match email against Insight (email → network → beta-model eeros)
//       → the tester's candidate DSN(s) + live status
//         → pick the beta unit (auto-filtered by model; select when ambiguous)
// The result is exactly the "user + DSN per program" table you drill into from a
// program card. `match` captures the three real-world outcomes of the email match.
type MatchState = 'matched' | 'multiple' | 'unmatched';

interface RosterCandidate {
  serial: string; // the DSN
  model: string;  // beta model — what the auto-filter narrows on
  online: boolean;
}

interface RosterEntry {
  id: string;
  tester: string;
  email: string;             // eero-account email — the match key
  match: MatchState;
  candidates: RosterCandidate[]; // beta-model eeros found on their network
  selectedSerial?: string;       // the chosen DSN (set when matched)
}

const ROSTER_NAMES = [
  'Shakeel Ahmad', 'Mark D Jones', 'Christer Whitehorn', 'Abilio J Henrique',
  'Patrick Evans', 'Santosh Choudhary', 'Aun Iftikhar', 'Sarah McLennan',
  'Jagdeep Singh', 'Hai Bu', 'Warren Cammack', 'Frank Fan',
];

// The beta model this program's units report as (drives the auto-filter).
function betaModelFor(program: DemoProgram): string {
  const n = program.name.toLowerCase();
  if (n.includes('merci')) return 'Merci';
  if (n.includes('outdoor')) return 'Outdoor Pro';
  if (n.includes('foghorn')) return 'Foghorn';
  return 'Beta Unit';
}

// GGC54MX36114xxxx-style serial so it reads like a real eero DSN.
function mkSerial(seed: number): string {
  const tail = (4000 + seed).toString(36).toUpperCase().padStart(4, '0');
  return `GGC54MX36114${tail}`;
}

// Deterministic per-program roster with a realistic match distribution:
// most testers auto-match to one beta unit, a few have multiple (pick one),
// a few don't resolve (wrong/mismatched email → fix in-app).
function rosterForProgram(program: DemoProgram): RosterEntry[] {
  if (program.type === 'feature') return []; // feature programs ship no hardware
  const model = betaModelFor(program);
  const count = Math.min(program.audienceSize, 12);
  const out: RosterEntry[] = [];
  for (let i = 0; i < count; i++) {
    const name = ROSTER_NAMES[i % ROSTER_NAMES.length];
    const handle = name.toLowerCase().replace(/[^a-z]+/g, '.');
    const r = (i * 7 + program.id.length) % 10;
    if (r === 2 || r === 9) {
      // unmatched — the list email (corporate) never resolved to an eero account
      out.push({ id: `${program.id}-r${i}`, tester: name, email: `${handle}@amazon.com`, match: 'unmatched', candidates: [] });
    } else if (r === 5) {
      // multiple — their account has two beta-model eeros; must pick the right one
      out.push({
        id: `${program.id}-r${i}`, tester: name, email: `${handle}@gmail.com`, match: 'multiple',
        candidates: [
          { serial: mkSerial(i * 3 + 1), model, online: true },
          { serial: mkSerial(i * 3 + 2), model, online: i % 2 === 0 },
        ],
      });
    } else {
      const serial = mkSerial(i + 1);
      out.push({
        id: `${program.id}-r${i}`, tester: name, email: `${handle}@gmail.com`, match: 'matched',
        candidates: [{ serial, model, online: r !== 4 }], selectedSerial: serial,
      });
    }
  }
  return out;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────
const TEXT_PRIMARY = 'var(--ui-text-text-primary)';
const TEXT_SECONDARY = 'var(--ui-text-text-secondary)';
const TEXT_TERTIARY = 'var(--ui-text-text-tertiary)';
const TRACK = 'var(--ui-core-gray-gray-2)';
// Semantic status colors (used for reliability/rate bars) — one source of truth.
const OK_GREEN = 'var(--ui-core-green-green-6)';
const WARN_ORANGE = 'var(--ui-core-orange-orange-5)';
const BAD_RED = 'var(--ui-core-red-red-6)';
const ACCENT = 'var(--ui-core-periwinkle-periwinkle-6)'; // primary brand accent for bars/values

// Status describes the RESPONSE state (the app doesn't author/edit surveys — that's
// Qualtrics). 'draft' = set up here but no responses yet; 'published' = collecting;
// 'closed' = done collecting.
const STATUS_TAG: Record<SurveyStatus, { color: 'green' | 'grey' | 'periwinkle'; label: string }> = {
  published: { color: 'green', label: 'Published' },
  draft: { color: 'grey', label: 'Awaiting responses' },
  closed: { color: 'periwinkle', label: 'Closed' },
};
function statusTag(status: SurveyStatus) {
  const s = STATUS_TAG[status];
  return <Tag color={s.color} size="regular">{s.label}</Tag>;
}

function programTag(type: ProgramType, name: string) {
  return (
    <Tag color={type === 'feature' ? 'purple' : 'ocean'} size="regular">{name}</Tag>
  );
}

function rate(responses: number, recipients: number) {
  return recipients > 0 ? Math.round((responses / recipients) * 100) : 0;
}

// Engagement is DERIVED from real activity (response reliability + missed surveys) —
// not a self-reported attribute. Same thresholds as the reliability bar's colors.
function engagementLevel(t: DemoTester): { label: string; color: 'green' | 'orange' | 'red' } {
  if (t.reliability >= 60 && t.missedSurveys <= 1) return { label: 'High', color: 'green' };
  if (t.reliability >= 30) return { label: 'Medium', color: 'orange' };
  return { label: 'Low', color: 'red' };
}

// "2026-09-08" -> "Sep 8". Used across the wave/phase timelines.
function fmtDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// The latest wave is the one we show by default; falls back to the survey's own
// flat responses/recipients for one-offs that carry no wave history.
function latestWave(s: DemoSurvey): SurveyWave | null {
  return s.waves && s.waves.length ? s.waves[s.waves.length - 1] : null;
}

function kindTag(kind: SurveyKind, cadence: Cadence) {
  const k = SURVEY_KINDS[kind];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Tag color="periwinkle-4" size="regular">{k.label}</Tag>
      {cadence === 'recurring'
        ? <Tag color="ocean" size="regular">Recurring</Tag>
        : <Tag color="grey" size="regular">One-off</Tag>}
    </span>
  );
}

function phaseTag(phase?: Phase) {
  if (!phase) return null;
  return <Tag color="periwinkle-4" size="regular">{phase}</Tag>;
}

// Simulated async call — the demo seam that a real Qualtrics/Bedrock call swaps into.
function simulate<T>(value: T, ms = 1400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ─── Small chart primitives (hand-built SVG/flex — matches OverviewDashboard) ──
// Bar palettes, hoisted so they're allocated once (not per render).
const RATING_BAR_COLORS = ['var(--ui-core-red-red-6)', 'var(--ui-core-orange-orange-5)', 'var(--ui-core-yellow-yellow-5)', 'var(--ui-core-green-green-4)', 'var(--ui-core-green-green-6)'];
// Cohesive cool palette (periwinkle/ocean/purple family) — no clashing warm hues.
const CHOICE_BAR_COLORS = ['var(--ui-core-periwinkle-periwinkle-6)', 'var(--ui-core-ocean-blue-ocean-6)', 'var(--ui-core-purple-purple-6)', 'var(--ui-core-periwinkle-periwinkle-4)', 'var(--ui-core-ocean-blue-ocean-4)'];

function StatTile({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <Card size={2}>
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-medium" style={{ color: accent || TEXT_PRIMARY }}>{value}</p>
        <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{label}</p>
      </div>
    </Card>
  );
}

function HBar({ label, count, max, color, suffix }: { label: string; count: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="w-44 shrink-0 truncate text-sm" style={{ color: TEXT_SECONDARY }}>{label}</span>
      <div className="h-3.5 flex-1 overflow-hidden rounded" style={{ backgroundColor: TRACK }}>
        <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-12 text-right text-xs" style={{ color: TEXT_TERTIARY }}>{count}{suffix || ''}</span>
    </div>
  );
}

function RatingChart({ counts }: { counts: number[] }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const avg = total > 0 ? counts.reduce((a, c, i) => a + c * (i + 1), 0) / total : 0;
  const max = Math.max(...counts, 1);
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-medium" style={{ color: TEXT_PRIMARY }}>{avg.toFixed(1)}</span>
        <span className="text-xs" style={{ color: TEXT_TERTIARY }}>avg · {total} responses</span>
      </div>
      {counts.map((c, i) => (
        <HBar key={i} label={`${i + 1} ★`} count={c} max={max} color={RATING_BAR_COLORS[i]} />
      ))}
    </div>
  );
}

function ChoiceChart({ choices }: { choices: { label: string; count: number }[] }) {
  const max = Math.max(...choices.map((c) => c.count), 1);
  return (
    <div>
      {choices.map((c, i) => (
        <HBar key={i} label={c.label} count={c.count} max={max} color={CHOICE_BAR_COLORS[i % CHOICE_BAR_COLORS.length]} />
      ))}
    </div>
  );
}

function YesNoDonut({ yes, no }: { yes: number; no: number }) {
  const total = yes + no || 1;
  const size = 96, stroke = 18, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const yesDash = (yes / total) * circ;
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ui-core-green-green-5)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ui-core-red-red-6)" strokeWidth={stroke} strokeDasharray={`${yesDash} ${circ - yesDash}`} strokeDashoffset={0} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>{Math.round((yes / total) * 100)}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2"><span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: 'var(--ui-core-red-red-6)' }} /><span style={{ color: TEXT_SECONDARY }}>Yes</span><b style={{ color: TEXT_PRIMARY }}>{yes}</b></div>
        <div className="flex items-center gap-2"><span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: 'var(--ui-core-green-green-5)' }} /><span style={{ color: TEXT_SECONDARY }}>No</span><b style={{ color: TEXT_PRIMARY }}>{no}</b></div>
      </div>
    </div>
  );
}

function sentimentTag(s: 'positive' | 'neutral' | 'negative') {
  const map = { positive: { c: 'green' as const, l: 'Positive' }, neutral: { c: 'grey' as const, l: 'Neutral' }, negative: { c: 'red' as const, l: 'Needs attention' } };
  return <Tag color={map[s].c} size="regular">{map[s].l}</Tag>;
}

// ─── Wave / phase timeline primitives ───────────────────────────────────────
// The clarity centerpiece: make "surveys repeat within a phase, and pause/resume
// around other surveys" legible AT A GLANCE instead of something you have to be told.

// Tiny inline trend of a recurring survey's response rate across its waves.
function Sparkline({ waves }: { waves: SurveyWave[] }) {
  if (waves.length < 2) return null;
  const pts = waves.map((w) => rate(w.responses, w.recipients));
  const w = 72, h = 20, max = Math.max(...pts, 1), min = Math.min(...pts, 0);
  const span = max - min || 1;
  const coords = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((p - min) / span) * (h - 4);
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} aria-hidden className="shrink-0">
      <polyline points={coords.join(' ')} fill="none" stroke="var(--ui-core-ocean-blue-ocean-6)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => {
        const [x, y] = c.split(',');
        return <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 2.5 : 1.5} fill="var(--ui-core-ocean-blue-ocean-6)" />;
      })}
    </svg>
  );
}

// One survey's own wave history — dated rows, newest last, with the resumed note.
function WaveTimeline({ waves, selectedId, onSelect }: { waves: SurveyWave[]; selectedId?: string; onSelect?: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {waves.map((wv) => {
        const r = rate(wv.responses, wv.recipients);
        const isSel = wv.id === selectedId;
        return (
          <button
            key={wv.id}
            type="button"
            onClick={() => onSelect?.(wv.id)}
            className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors"
            style={{
              borderColor: isSel ? 'var(--ui-core-ocean-blue-ocean-5)' : TRACK,
              backgroundColor: isSel ? 'var(--ui-core-ocean-blue-ocean-1)' : 'transparent',
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <span className="w-16 shrink-0 text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{wv.label}</span>
            <span className="w-14 shrink-0 text-xs" style={{ color: TEXT_TERTIARY }}>{fmtDate(wv.date)}</span>
            <div className="h-2 flex-1 overflow-hidden rounded" style={{ backgroundColor: TRACK }}>
              <div className="h-full rounded" style={{ width: `${r}%`, backgroundColor: r >= 70 ? 'var(--ui-core-green-green-6)' : 'var(--ui-core-orange-orange-5)' }} />
            </div>
            <span className="w-24 shrink-0 text-right text-xs" style={{ color: TEXT_TERTIARY }}>{wv.responses}/{wv.recipients} · {r}%</span>
            {wv.resumedNote && <Tag color="periwinkle-4" size="regular">Resumed</Tag>}
          </button>
        );
      })}
    </div>
  );
}

// A flattened event on the phase timeline: either a wave of a recurring survey
// or the single run of a one-off. Sorting by date interleaves them so the
// "Performance → RTM → Performance" story reads left-to-right.
interface PhaseEvent { date: string; title: string; kind: SurveyKind; rate: number; resumed?: boolean; }

function buildPhaseEvents(surveys: DemoSurvey[]): PhaseEvent[] {
  const events: PhaseEvent[] = [];
  for (const s of surveys) {
    if (s.waves && s.waves.length) {
      for (const wv of s.waves) {
        events.push({ date: wv.date, title: `${SURVEY_KINDS[s.kind].label} · ${wv.label}`, kind: s.kind, rate: rate(wv.responses, wv.recipients), resumed: !!wv.resumedNote });
      }
    } else if (s.ranOn) {
      events.push({ date: s.ranOn, title: SURVEY_KINDS[s.kind].label, kind: s.kind, rate: rate(s.responses, s.recipients) });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// The horizontal dated strip a newcomer reads to understand a phase at a glance.
function PhaseTimeline({ surveys }: { surveys: DemoSurvey[] }) {
  const events = useMemo(() => buildPhaseEvents(surveys), [surveys]);
  if (events.length < 2) return null;
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: TRACK, backgroundColor: 'var(--ui-background-bg-primary, #fff)' }}>
      <p className="mb-2 text-xs font-medium" style={{ color: TEXT_TERTIARY }}>Phase timeline — what ran, when (paused pulses and re-runs show as gaps)</p>
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs" style={{ color: TRACK }}>—</span>}
            <div
              className="flex min-w-[7.5rem] flex-col gap-0.5 rounded-md px-2 py-1.5"
              style={{ backgroundColor: e.kind === 'performance' ? 'var(--ui-core-ocean-blue-ocean-1)' : 'var(--ui-core-periwinkle-periwinkle-1)' }}
            >
              <span className="text-xs font-medium" style={{ color: TEXT_PRIMARY }}>
                {e.title}{e.resumed ? ' · resumed' : ''}
              </span>
              <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{fmtDate(e.date)} · {e.rate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI feedback summary (deterministic mock — a real Bedrock call swaps in) ──
type Tone = 'positive' | 'neutral' | 'negative';
type Severity = 'high' | 'medium' | 'low';
type Priority = 'P0' | 'P1' | 'P2';

interface AISummary {
  headline: string;                                    // one-line TL;DR
  sentiment: { positive: number; neutral: number; negative: number }; // % (sum ~100)
  responsesAnalyzed: number;
  trend?: string;                                      // vs previous wave (recurring surveys)
  themes: { title: string; detail: string; mentions: number; tone: Tone }[];
  criticalIssues: { issue: string; severity: Severity; frequency: string; quote?: string }[];
  featureRequests: { request: string; mentions: number }[];
  actions: { action: string; priority: Priority }[];
}

const AI_SUMMARIES: Record<string, AISummary> = {
  'sv-foghorn-setup': {
    headline: 'Setup succeeds for the large majority, but the ~6-minute reboot with no progress UI is the dominant frustration — and the clearest, highest-leverage fix.',
    sentiment: { positive: 73, neutral: 12, negative: 15 },
    responsesAnalyzed: 41,
    themes: [
      { title: 'Fast, familiar setup', detail: 'Most testers rated install ease 4–5/5 (avg 4.1) and finished without contacting support.', mentions: 29, tone: 'positive' },
      { title: 'Reboot phase is the pain point', detail: 'The long reboot with no on-screen progress drove nearly all of the negative sentiment.', mentions: 14, tone: 'negative' },
      { title: 'Settings carry-over builds trust', detail: 'Testers explicitly praised that their configuration survived the update.', mentions: 8, tone: 'positive' },
    ],
    criticalIssues: [
      { issue: 'No progress indicator during the ~6-min reboot — testers feared a bricked unit', severity: 'high', frequency: '11 of 41 (27%)', quote: '“Reboot took ~6 minutes and the app showed no progress — I thought it had bricked.”' },
      { issue: '6E band disappears until a manual gateway power-cycle', severity: 'high', frequency: 'Repeatable on ≥1 unit (L. Hill)', quote: '“The 6E band disappeared until I power-cycled the gateway. Repeatable on my unit.”' },
      { issue: 'Device(s) dropped off the network after the update', severity: 'medium', frequency: '11 of 41 (27%)' },
    ],
    featureRequests: [
      { request: 'Progress bar / ETA during reboot', mentions: 12 },
      { request: 'Auto-reconnect for wired devices post-reboot', mentions: 5 },
    ],
    actions: [
      { action: 'File a bug for the missing reboot progress UI — highest-frequency complaint', priority: 'P0' },
      { action: 'Investigate the 6E-band-after-reboot regression on L. Hill’s unit', priority: 'P1' },
      { action: 'Add post-update reconnect telemetry to quantify device drop-offs', priority: 'P2' },
    ],
  },
  'sv-merci-weekly': {
    headline: 'Indoor coverage and stability hold up well; backyard/edge coverage is the persistent weak spot and the main driver of churn risk.',
    sentiment: { positive: 64, neutral: 20, negative: 16 },
    responsesAnalyzed: 39,
    trend: 'Response rate recovered to 63% in Wave 4 after the RTM pause; coverage rating flat vs Wave 3 (3.7 → 3.7).',
    themes: [
      { title: 'Solid whole-home coverage indoors', detail: 'Avg 3.7/5; most rate 4–5 for primary living spaces.', mentions: 26, tone: 'positive' },
      { title: 'Backyard / outdoor is the recurring gap', detail: 'Edge nodes drop to 2.4GHz with a large speed loss when it happens.', mentions: 16, tone: 'negative' },
      { title: 'Stability good, isolated reboots', detail: 'Disconnects are the minority and concentrated on specific nodes.', mentions: 9, tone: 'neutral' },
    ],
    criticalIssues: [
      { issue: 'Backyard node dropping to 2.4GHz with large speed loss', severity: 'high', frequency: 'P. Rivera + 3 others', quote: '“Backyard node keeps dropping to 2.4GHz. Speeds tank when it does.”' },
      { issue: 'Drops / disconnects during the week', severity: 'medium', frequency: '14 of 39 (36%)' },
    ],
    featureRequests: [
      { request: 'Better band-steering for edge nodes', mentions: 11 },
      { request: 'Outdoor range guidance during placement', mentions: 6 },
    ],
    actions: [
      { action: 'Correlate backyard-node reports with device telemetry to confirm the band-steering issue', priority: 'P0' },
      { action: 'Flag P. Rivera’s report for follow-up — detailed and reproducible', priority: 'P1' },
      { action: 'Add outdoor/edge-node placement guidance to onboarding', priority: 'P2' },
    ],
  },
  'sv-merci-rtm': {
    headline: 'Production units validate strongly — 92% pass first-boot self-test and testers rate them at or above their earlier EVT/DVT units; only minor cosmetic issues remain.',
    sentiment: { positive: 84, neutral: 10, negative: 6 },
    responsesAnalyzed: 51,
    trend: 'RTM validation ran between weekly Waves 3 and 4.',
    themes: [
      { title: 'Production hardware meets the bar', detail: 'Testers rate the production unit ≥ their earlier EVT/DVT hardware (avg 4.2/5).', mentions: 43, tone: 'positive' },
      { title: 'Clean first boot', detail: '92% passed the self-test on first boot with no intervention.', mentions: 47, tone: 'positive' },
      { title: 'Minor cosmetic / connector defects', detail: 'A small number reported cosmetic blemishes or a port/connector issue.', mentions: 10, tone: 'neutral' },
    ],
    criticalIssues: [
      { issue: 'Self-test failure on first boot', severity: 'medium', frequency: '4 of 51 (8%)' },
      { issue: 'Port / connector issue on the production unit', severity: 'low', frequency: '2 of 51' },
    ],
    featureRequests: [
      { request: 'Tighter QA on port/connector seating', mentions: 2 },
    ],
    actions: [
      { action: 'Root-cause the 4 first-boot self-test failures before ramp', priority: 'P0' },
      { action: 'Add a port-seating check to the production-line QA checklist', priority: 'P1' },
    ],
  },
  'sv-outdoor-coverage': {
    headline: 'Outdoor coverage lands well (avg 4.2/5); the one real gap is mounting hardware for non-standard install surfaces.',
    sentiment: { positive: 82, neutral: 11, negative: 7 },
    responsesAnalyzed: 27,
    themes: [
      { title: 'Strong outdoor coverage', detail: 'Avg 4.2/5 satisfaction across a range of install sites.', mentions: 22, tone: 'positive' },
      { title: 'Mounting-kit gaps', detail: '~19% found the mounting hardware insufficient for their surface.', mentions: 5, tone: 'negative' },
    ],
    criticalIssues: [
      { issue: 'Mounting hardware insufficient for some install locations', severity: 'medium', frequency: '5 of 27 (19%)' },
    ],
    featureRequests: [
      { request: 'More mounting-bracket options for non-standard surfaces', mentions: 5 },
    ],
    actions: [
      { action: 'Review mounting-kit contents for the next hardware revision', priority: 'P1' },
    ],
  },
};

const TONE_COLOR: Record<Tone, string> = {
  positive: 'var(--ui-core-green-green-6)',
  neutral: 'var(--ui-core-gray-gray-5)',
  negative: 'var(--ui-core-red-red-6)',
};
const SEVERITY_TAG: Record<Severity, { color: 'red' | 'orange' | 'grey'; label: string }> = {
  high: { color: 'red', label: 'High' },
  medium: { color: 'orange', label: 'Medium' },
  low: { color: 'grey', label: 'Low' },
};
const PRIORITY_TAG: Record<Priority, 'red' | 'orange' | 'grey'> = { P0: 'red', P1: 'orange', P2: 'grey' };

// Stacked positive/neutral/negative sentiment bar with a legend.
function SentimentBar({ s }: { s: AISummary['sentiment'] }) {
  const segs = [
    { key: 'Positive', pct: s.positive, color: 'var(--ui-core-green-green-5)' },
    { key: 'Neutral', pct: s.neutral, color: 'var(--ui-core-gray-gray-4)' },
    { key: 'Negative', pct: s.negative, color: 'var(--ui-core-red-red-5)' },
  ];
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segs.map((seg) => <div key={seg.key} style={{ width: `${seg.pct}%`, backgroundColor: seg.color }} />)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {segs.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1.5 text-xs" style={{ color: TEXT_SECONDARY }}>
            <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />{seg.key} <b style={{ color: TEXT_PRIMARY }}>{seg.pct}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function AISummaryPanel({ surveyId, responses }: { surveyId: string; responses: number }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const summary = AI_SUMMARIES[surveyId];

  if (!summary) {
    return <p className="text-sm" style={{ color: TEXT_TERTIARY }}>No responses yet — AI summary available once this survey collects feedback.</p>;
  }

  if (state === 'idle') {
    return (
      <div className="flex items-center gap-3">
        <Button type="default" leftIcon={ICONS.FUNCTIONAL_INSIGHTAI} label="Generate AI Summary" onClick={() => { setState('loading'); simulate(true).then(() => setState('done')); }} />
        <span className="text-xs" style={{ color: TEXT_TERTIARY }}>Reads every response via Bedrock and writes the briefing below (simulated)</span>
      </div>
    );
  }

  if (state === 'loading') {
    return <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Reading {responses} responses and summarizing…</p>;
  }

  const maxReq = Math.max(...summary.featureRequests.map((r) => r.mentions), 1);
  const SectionLabel = ({ children, color }: { children: React.ReactNode; color: string }) => (
    <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color }}>{children}</p>
  );

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ui-core-purple-purple-1)' }}>
      {/* Header + coverage */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: TEXT_PRIMARY }}><Icon icon={ICONS.FUNCTIONAL_INSIGHTAI} className="h-4 w-4" />AI Feedback Summary</span>
        <Tag color="purple" size="regular">Generated</Tag>
        <span className="text-xs" style={{ color: TEXT_TERTIARY }}>Analyzed {summary.responsesAnalyzed} responses</span>
      </div>

      {/* Headline TL;DR */}
      <p className="mb-4 text-sm font-medium leading-snug" style={{ color: TEXT_PRIMARY }}>{summary.headline}</p>

      {/* Sentiment */}
      <div className="mb-4">
        <SectionLabel color="var(--ui-core-purple-purple-7)">Sentiment</SectionLabel>
        <SentimentBar s={summary.sentiment} />
        {summary.trend && (
          <p className="mt-2 rounded-md px-2.5 py-1.5 text-xs" style={{ backgroundColor: 'var(--ui-core-ocean-blue-ocean-1)', color: TEXT_SECONDARY }}>{summary.trend}</p>
        )}
      </div>

      {/* Key themes */}
      <div className="mb-4">
        <SectionLabel color="var(--ui-core-purple-purple-7)">Key Themes</SectionLabel>
        <div className="flex flex-col gap-2">
          {summary.themes.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1.5 inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: TONE_COLOR[t.tone] }} />
              <div>
                <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{t.title} <span className="text-xs font-normal" style={{ color: TEXT_TERTIARY }}>· {t.mentions} mentions</span></p>
                <p className="text-sm leading-snug" style={{ color: TEXT_SECONDARY }}>{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical issues */}
      <div className="mb-4">
        <SectionLabel color="var(--ui-core-red-red-6)">Critical Issues</SectionLabel>
        <div className="flex flex-col gap-2">
          {summary.criticalIssues.map((c, i) => (
            <div key={i} className="rounded-lg border p-2.5" style={{ borderColor: 'var(--ui-core-red-red-3)', backgroundColor: 'var(--ui-background-bg-primary, #fff)' }}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Tag color={SEVERITY_TAG[c.severity].color} size="regular">{SEVERITY_TAG[c.severity].label}</Tag>
                <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{c.frequency}</span>
              </div>
              <p className="text-sm leading-snug" style={{ color: TEXT_SECONDARY }}>{c.issue}</p>
              {c.quote && <p className="mt-1 text-xs italic leading-snug" style={{ color: TEXT_TERTIARY }}>{c.quote}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Feature requests with demand */}
      <div className="mb-4">
        <SectionLabel color="var(--ui-core-ocean-blue-ocean-6)">Top Feature Requests</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {summary.featureRequests.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex-1 text-sm" style={{ color: TEXT_SECONDARY }}>{r.request}</span>
              <div className="h-2 w-24 overflow-hidden rounded" style={{ backgroundColor: TRACK }}>
                <div className="h-full rounded" style={{ width: `${(r.mentions / maxReq) * 100}%`, backgroundColor: 'var(--ui-core-ocean-blue-ocean-6)' }} />
              </div>
              <span className="w-16 text-right text-xs" style={{ color: TEXT_TERTIARY }}>{r.mentions} asks</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended actions */}
      <div>
        <SectionLabel color="var(--ui-core-green-green-6)">Recommended Actions</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {summary.actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <Tag color={PRIORITY_TAG[a.priority]} size="regular">{a.priority}</Tag>
              <span className="text-sm leading-snug" style={{ color: TEXT_SECONDARY }}>{a.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Survey results view (charts + AI summary + closed-loop JIRA) ────────────
function QuestionBlock({ q, onCreateTicket }: { q: DemoQuestion; onCreateTicket: (text: string) => void }) {
  return (
    <Card size={4} title={<span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{q.title}</span>}>
      {q.type === 'rating' && q.ratingCounts && <RatingChart counts={q.ratingCounts} />}
      {q.type === 'multiple_choice' && q.choiceCounts && <ChoiceChart choices={q.choiceCounts} />}
      {q.type === 'yes_no' && q.yesNo && <YesNoDonut yes={q.yesNo.yes} no={q.yesNo.no} />}
      {q.type === 'text' && q.textResponses && (
        <div className="flex flex-col gap-3">
          {q.textResponses.map((r, i) => (
            <div key={i} className="rounded-lg border p-3" style={{ borderColor: TRACK }}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-medium" style={{ color: TEXT_TERTIARY }}>{r.tester}</span>
                {sentimentTag(r.sentiment)}
              </div>
              <p className="mb-2 text-sm leading-snug" style={{ color: TEXT_SECONDARY }}>{r.text}</p>
              {r.sentiment === 'negative' && (
                <Button type="text" leftIcon={ICONS.FUNCTIONAL_TAG} label="Create JIRA ticket" onClick={() => onCreateTicket(r.text)} />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Draft view ──────────────────────────────────────────────────────────────
// A survey created here has no responses yet. The app does NOT send surveys — you
// build and send them in Qualtrics. As testers respond, that data is collected and
// pushed to Insight, then shown here and rolled up onto the program card. So this
// view just states that pipeline and shows the survey's setup — no charts, no fake
// "distribute" action.
function DraftPanel({ survey, onBack, onDelete }: { survey: DemoSurvey; onBack: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button type="text" label="← Back to surveys" onClick={onBack} />
        <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} label="Delete survey" onClick={onDelete} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium" style={{ color: TEXT_PRIMARY }}>{survey.title}</h2>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: TEXT_TERTIARY }}>{survey.description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {statusTag(survey.status)}{programTag(survey.programType, survey.programName)}{phaseTag(survey.phase)}{kindTag(survey.kind, survey.cadence)}
        </div>
      </div>

      <Card size={4}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span style={{ color: TEXT_TERTIARY }}><Icon icon={ICONS.FUNCTIONAL_PENDING} className="h-8 w-8" title="Awaiting responses" /></span>
          <div>
            <p className="text-base font-medium" style={{ color: TEXT_PRIMARY }}>Set up — waiting on responses</p>
            <p className="mx-auto mt-1 max-w-lg text-sm" style={{ color: TEXT_TERTIARY }}>
              Build and send this survey to its {survey.recipients > 0 ? <b style={{ color: TEXT_SECONDARY }}>{survey.recipients}</b> : 'program’s'} testers in <b style={{ color: TEXT_SECONDARY }}>Qualtrics</b> as usual. As testers respond, their data is collected and pushed to <b style={{ color: TEXT_SECONDARY }}>Insight</b>, then shown here and rolled up onto the program card — no sending happens from this app.
            </p>
          </div>
        </div>

        {/* Draft metadata — the fields that ARE meaningful for a draft */}
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 md:grid-cols-4" style={{ borderColor: TRACK }}>
          <div>
            <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Program</p>
            <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{survey.programName}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Type</p>
            <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{SURVEY_KINDS[survey.kind].label}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Cadence</p>
            <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{survey.cadence === 'recurring' ? 'Recurring' : 'One-off'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Audience</p>
            <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{survey.recipients > 0 ? `${survey.recipients} testers` : '—'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SurveyResults({ survey, onBack, onToast, onDelete }: { survey: DemoSurvey; onBack: () => void; onToast: (msg: string) => void; onDelete: () => void }) {
  const waves = survey.waves ?? [];
  // Default the view to the LATEST wave — the "keep vs get rid of" rule made concrete:
  // history is kept, but the current wave is what you land on.
  const [selectedWaveId, setSelectedWaveId] = useState<string>(waves.length ? waves[waves.length - 1].id : '');
  const selectedWave = waves.find((w) => w.id === selectedWaveId) ?? null;
  const responses = selectedWave ? selectedWave.responses : survey.responses;
  const recipients = selectedWave ? selectedWave.recipients : survey.recipients;
  const responseRate = rate(responses, recipients);
  let ticketSeq = 4821;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button type="text" label="← Back to surveys" onClick={onBack} />
        <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} label="Delete survey" onClick={onDelete} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium" style={{ color: TEXT_PRIMARY }}>{survey.title}</h2>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: TEXT_TERTIARY }}>{survey.description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">{statusTag(survey.status)}{programTag(survey.programType, survey.programName)}{phaseTag(survey.phase)}{kindTag(survey.kind, survey.cadence)}</div>
      </div>

      {/* Targeting seam */}
      <Card size={3}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: TEXT_SECONDARY }}>
          <span>Targeted to <b style={{ color: TEXT_PRIMARY }}>{survey.programName}</b>{survey.audienceFilter ? <> · filtered to <b style={{ color: TEXT_PRIMARY }}>{survey.audienceFilter}</b> testers</> : null}</span>
          <span>Qualtrics: <code className="text-xs">{survey.qualtricsId}</code></span>
          <Tag color="periwinkle-4" size="regular">Synced from Qualtrics (simulated)</Tag>
        </div>
      </Card>

      {/* Wave history — recurring surveys keep every wave; pick which to view */}
      {waves.length > 0 && (
        <Card size={4} title={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Waves ({waves.length})</span>
            <Tag color="ocean" size="regular">Recurring pulse</Tag>
          </div>
        }>
          <p className="mb-3 text-xs" style={{ color: TEXT_TERTIARY }}>
            Each wave is one weekly send. History is never deleted — you&apos;re viewing <b style={{ color: TEXT_SECONDARY }}>{selectedWave?.label ?? 'the latest wave'}</b> by default; click any wave to see its numbers. A “Resumed” tag marks where the pulse resumed after another survey ran.
          </p>
          <WaveTimeline waves={waves} selectedId={selectedWaveId} onSelect={setSelectedWaveId} />
          {selectedWave?.resumedNote && (
            <p className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'var(--ui-core-periwinkle-periwinkle-1)', color: TEXT_SECONDARY }}>
              <b style={{ color: TEXT_PRIMARY }}>{selectedWave.label}</b> — {selectedWave.resumedNote}. The pulse paused between the prior wave and this one while that survey ran, then continued its wave count.
            </p>
          )}
        </Card>
      )}

      {/* Stat row — reflects the selected wave */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile value={recipients} label="Recipients" />
        <StatTile value={responses} label={selectedWave ? `Responses · ${selectedWave.label}` : 'Responses'} accent="var(--ui-core-periwinkle-periwinkle-6)" />
        <StatTile value={`${responseRate}%`} label="Response rate" accent={responseRate >= 70 ? 'var(--ui-core-green-green-6)' : 'var(--ui-core-orange-orange-6)'} />
        <StatTile value={`${survey.avgCompletionMins}m`} label="Avg completion" />
      </div>

      {/* AI summary */}
      <Card size={4} title={<span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>AI Feedback Summary</span>}>
        <AISummaryPanel surveyId={survey.id} responses={survey.responses} />
      </Card>

      {/* Per-question breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {survey.questions.map((q) => (
          <QuestionBlock key={q.id} q={q} onCreateTicket={() => onToast(`Created BETA-${ticketSeq++} from response · linked to ${survey.programName}`)} />
        ))}
      </div>
    </div>
  );
}

// ─── Survey list view (grouped by program → phase) ───────────────────────────
function SurveyCard({ s, onSelect, onDelete }: { s: DemoSurvey; onSelect: (s: DemoSurvey) => void; onDelete: (s: DemoSurvey) => void }) {
  const wave = latestWave(s);
  const r = wave ? rate(wave.responses, wave.recipients) : rate(s.responses, s.recipients);
  const responses = wave ? wave.responses : s.responses;
  const recipients = wave ? wave.recipients : s.recipients;
  const waveCount = s.waves?.length ?? 0;
  return (
    <Card size={4}>
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          {statusTag(s.status)}
          <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{s.questions.length} questions</span>
        </div>
        <div>
          <p className="text-base font-medium leading-snug" style={{ color: TEXT_PRIMARY }}>{s.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">{kindTag(s.kind, s.cadence)}{phaseTag(s.phase)}</div>
        </div>

        {/* Recurring pulse: which wave you're looking at + trend across waves */}
        {waveCount > 0 && wave && (
          <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: 'var(--ui-core-ocean-blue-ocean-1)' }}>
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: TEXT_PRIMARY }}>{wave.label} · {fmtDate(wave.date)}</span>
              <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{waveCount} waves{wave.resumedNote ? ' · resumed after RTM' : ''}</span>
            </div>
            <Sparkline waves={s.waves!} />
          </div>
        )}

        <div className="mt-auto">
          {s.status === 'draft'
            ? <p className="text-sm" style={{ color: TEXT_TERTIARY }}>No responses yet</p>
            : <ProgressBar className="w-full" label={`${responses}/${recipients} responses${wave ? ` · ${wave.label}` : ''}`} percent={r} />}
        </div>
        <div className="flex items-center gap-2">
          <Button type="default" label={s.status === 'draft' ? 'View' : 'View results'} onClick={() => onSelect(s)} />
          <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} ariaLabel="Delete survey" onClick={() => onDelete(s)} />
        </div>
      </div>
    </Card>
  );
}

function SurveyList({ surveys, onSelect, onNewSurvey, onDelete }: { surveys: DemoSurvey[]; onSelect: (s: DemoSurvey) => void; onNewSurvey: () => void; onDelete: (s: DemoSurvey) => void }) {
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');
  const filtered = surveys.filter((s) => statusFilter === 'all' || s.status === statusFilter);

  // Group by program (preserving first-seen order), then order each group by phase then kind.
  const groups = useMemo(() => {
    const map = new Map<string, DemoSurvey[]>();
    for (const s of filtered) {
      if (!map.has(s.programName)) map.set(s.programName, []);
      map.get(s.programName)!.push(s);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-56">
          <Select
            id="survey-status-filter"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as SurveyStatus | 'all')}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Awaiting responses' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="primary" leftIcon={ICONS.FUNCTIONAL_ADD} label="New Survey" onClick={onNewSurvey} />
        </div>
      </div>

      {groups.map(([programName, group]) => {
        const programType = group[0].programType;
        const phases = Array.from(new Set(group.map((s) => s.phase).filter(Boolean))) as Phase[];
        // Split a program's surveys into phase sub-groups (hardware); feature
        // programs have no phase, so they fall into a single 'none' bucket.
        const orderedPhases: (Phase | 'none')[] = [
          ...PHASES.filter((p) => phases.includes(p)),
          ...(group.some((s) => !s.phase) ? (['none'] as const) : []),
        ];
        return (
          <div key={programName} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 border-b pb-2" style={{ borderColor: TRACK }}>
              {programTag(programType, programName)}
              {phases.map((p) => phaseTag(p))}
              <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{group.length} survey{group.length === 1 ? '' : 's'}</span>
            </div>

            {orderedPhases.map((ph) => {
              const inPhase = group.filter((s) => (ph === 'none' ? !s.phase : s.phase === ph));
              if (inPhase.length === 0) return null;
              const kinds = Array.from(new Set(inPhase.map((s) => SURVEY_KINDS[s.kind].label)));
              return (
                <div key={ph} className="flex flex-col gap-3">
                  {ph !== 'none' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {phaseTag(ph)}
                      <span className="text-xs" style={{ color: TEXT_TERTIARY }}>Running: {kinds.join(' · ')}</span>
                    </div>
                  )}
                  {/* The at-a-glance story of the phase: dated events, gaps and resumes visible */}
                  <PhaseTimeline surveys={inPhase} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {inPhase.map((s) => <SurveyCard key={s.id} s={s} onSelect={onSelect} onDelete={onDelete} />)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Engagement & At-Risk view ───────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return <span style={{ color: 'var(--ui-core-yellow-yellow-6)' }}>{'★'.repeat(n)}<span style={{ color: TRACK }}>{'★'.repeat(5 - n)}</span></span>;
}

function EngagementView({ onToast }: { onToast: (msg: string) => void }) {
  const [narration, setNarration] = useState<'idle' | 'loading' | 'done'>('idle');

  // Rules engine — deterministic, explainable. AI only narrates the output.
  const atRisk = useMemo(() => TESTERS.filter((t) => {
    const offline = t.deviceOnline === false;             // hardware: device offline
    const unresponsive = t.missedSurveys >= 3;            // missed 3+ surveys
    const lowReliability = t.reliability < 30;            // reliability under 30%
    return (offline || t.deviceOnline === null) && unresponsive && lowReliability;
  }), []);

  return (
    <div className="flex flex-col gap-4">
      {/* At-Risk */}
      <Card size={4} title={<span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: TEXT_PRIMARY }}><span style={{ color: WARN_ORANGE }}><Icon icon={ICONS.FUNCTIONAL_WARNINGREGULAR} className="h-4 w-4" /></span>At-Risk / Action Needed</span>}>
        <p className="mb-3 text-xs" style={{ color: TEXT_TERTIARY }}>
          Rules: (device offline <b>or</b> feature program) · missed ≥3 surveys · reliability &lt; 30%. The intersection of device status and survey engagement — the reason to merge these two apps.
        </p>
        <div className="flex flex-col gap-2">
          {atRisk.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--ui-core-red-red-3)', backgroundColor: 'var(--ui-core-red-red-1)' }}>
              <div>
                <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{t.name}</span>
                <span className="ml-2 text-xs" style={{ color: TEXT_TERTIARY }}>{t.programName}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {t.deviceOnline === false && <Tag color="red" size="regular">Device offline</Tag>}
                <Tag color="orange" size="regular">{t.missedSurveys} missed surveys</Tag>
                <Tag color="grey" size="regular">{t.reliability}% reliability</Tag>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          {narration === 'idle' && (
            <Button type="default" leftIcon={ICONS.FUNCTIONAL_INSIGHTAI} label="Ask AI what to do" onClick={() => { setNarration('loading'); simulate(true).then(() => setNarration('done')); }} />
          )}
          {narration === 'loading' && <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Analyzing at-risk testers…</p>}
          {narration === 'done' && (
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ui-core-purple-purple-1)' }}>
              <p className="text-sm leading-snug" style={{ color: TEXT_SECONDARY }}>
                <b style={{ color: TEXT_PRIMARY }}>{atRisk.length} testers are reclaim candidates.</b> {atRisk.find((t) => t.deviceOnline === false)?.name || 'Two'} and others on Merci/Outdoor have offline devices and haven&apos;t responded in 8+ days — prioritize hardware recovery here. For the Foghorn feature testers who&apos;ve gone dark, there&apos;s no device to reclaim, so drop them from the program and backfill from the waitlist. <b style={{ color: TEXT_PRIMARY }}>Suggested next step:</b> send a final outreach, then reclaim/backfill after 5 days.
              </p>
              <div className="mt-3 flex gap-2">
                <Button type="default" label="Send final outreach" onClick={() => onToast('Drafted final-outreach emails to ' + atRisk.length + ' testers (simulated)')} />
                <Button type="text" label="Create reclaim tickets" onClick={() => onToast('Created ' + atRisk.length + ' reclaim tickets in JIRA (simulated)')} />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Engagement table (EDS TableV2) */}
      <Card size={4} title={<span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Tester Engagement</span>}>
        <p className="mb-3 text-xs" style={{ color: TEXT_TERTIARY }}>Derived from survey activity — engagement is computed from response reliability and missed surveys.</p>
        <TableV2
          data={TESTERS}
          emptyText="No testers yet"
          columns={[
            { accessorKey: 'name', header: 'Tester', cell: (c: any) => <span style={{ color: TEXT_PRIMARY }}>{c.row.original.name}</span> },
            { accessorKey: 'programName', header: 'Program', cell: (c: any) => <span style={{ color: TEXT_SECONDARY }}>{c.row.original.programName}</span> },
            { id: 'engagement', header: 'Engagement', cell: (c: any) => { const e = engagementLevel(c.row.original); return <Tag color={e.color} size="regular">{e.label}</Tag>; } },
            { accessorKey: 'reliability', header: 'Reliability', cell: (c: any) => {
              const t = c.row.original as DemoTester;
              return (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded" style={{ backgroundColor: TRACK }}>
                    <div className="h-full rounded" style={{ width: `${t.reliability}%`, backgroundColor: t.reliability >= 60 ? OK_GREEN : t.reliability >= 30 ? WARN_ORANGE : BAD_RED }} />
                  </div>
                  <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{t.reliability}%</span>
                </div>
              );
            } },
            { accessorKey: 'avgResponseDays', header: 'Avg response', cell: (c: any) => <span style={{ color: TEXT_SECONDARY }}>{c.row.original.avgResponseDays}d</span> },
            { accessorKey: 'feedbackQuality', header: 'Feedback quality', cell: (c: any) => <Stars n={c.row.original.feedbackQuality} /> },
          ] as any}
        />
      </Card>
    </div>
  );
}

// ─── Program Health view ─────────────────────────────────────────────────────
// ─── Program → device roster drill-in (merged from the old Programs menu) ─────
// This is the "user + DSN per program" table you open from a program card. It's
// the same device list the standalone Programs menu showed, now scoped to one
// program and driven by the Insight identity-match model (email → network →
// beta-model DSN), with in-app resolution for the rows that don't auto-match.
function ProgramDevicesView({ program, onBack, onToast }: {
  program: DemoProgram;
  onBack: () => void;
  onToast: (msg: string) => void;
}) {
  const model = betaModelFor(program);
  const [roster, setRoster] = useState<RosterEntry[]>(() => rosterForProgram(program));
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const matched = roster.filter((r) => r.match === 'matched').length;
  const needsPick = roster.filter((r) => r.match === 'multiple').length;
  const unmatched = roster.filter((r) => r.match === 'unmatched').length;
  const onlineCount = roster.filter((r) => r.match === 'matched' && r.candidates.find((c) => c.serial === r.selectedSerial)?.online).length;

  const pickSerial = (id: string, serial: string) => {
    if (!serial) return;
    setRoster((prev) => prev.map((r) => (r.id === id ? { ...r, selectedSerial: serial, match: 'matched' as MatchState } : r)));
    onToast(`Selected ${serial} as this tester's beta unit`);
  };
  const removeTester = (id: string) => {
    setRoster((prev) => prev.filter((r) => r.id !== id));
    onToast('Removed tester from program');
  };
  const fixMatch = (id: string) => {
    setRoster((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const serial = mkSerial(r.tester.length + 20);
      return { ...r, match: 'matched' as MatchState, email: r.email.replace('@amazon.com', '@gmail.com'), candidates: [{ serial, model, online: true }], selectedSerial: serial };
    }));
    onToast('Re-matched on corrected eero-account email (simulated)');
  };
  const addTester = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setRoster((prev) => [{ id: `${program.id}-new-${prev.length}-${Date.now()}`, tester: newName.trim(), email: newEmail.trim(), match: 'unmatched' as MatchState, candidates: [] }, ...prev]);
    onToast(`Added ${newName.trim()} — resolve their device below`);
    setNewName(''); setNewEmail(''); setAddOpen(false);
  };
  const rowAction = (serial: string, action: string) => {
    if (!action) return;
    onToast(`${action} queued for ${serial} (simulated)`);
  };

  const thCls = 'px-3 py-2 text-left text-xs font-bold uppercase';
  const tdCls = 'px-3 py-2.5 align-middle text-sm';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="text" label="← Back to programs" onClick={onBack} />
          <span className="text-base font-medium" style={{ color: TEXT_PRIMARY }}>{program.name}</span>
          {programTag(program.type, program.type === 'feature' ? 'Feature' : 'Hardware')}
          {program.type === 'hardware' && program.currentPhase && <Tag color="periwinkle-4" size="regular">Phase: {program.currentPhase}</Tag>}
        </div>
        {program.type === 'hardware' && (
          <Button type="default" leftIcon={ICONS.FUNCTIONAL_REFRESH} label="Sync from Insight" onClick={() => onToast('Re-synced roster from Insight — matched by eero-account email (simulated)')} />
        )}
      </div>

      {program.type === 'feature' ? (
        <Card size={4}>
          <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
            <b style={{ color: TEXT_PRIMARY }}>Feature program — no hardware shipped.</b> Testers participate through surveys only, so there is no device list to match here. The roster is the Qualtrics audience for this program.
          </p>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border px-3 py-2.5 text-xs" style={{ borderColor: TRACK, backgroundColor: 'var(--ui-core-periwinkle-periwinkle-1)', color: TEXT_SECONDARY }}>
            Built from the Qualtrics roster: each tester&apos;s <b style={{ color: TEXT_PRIMARY }}>eero-account email</b> resolves to their network in Insight, auto-filtered to the <b style={{ color: TEXT_PRIMARY }}>{model}</b> beta model. Pick the unit when someone has more than one; fix the email when it doesn&apos;t resolve.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tag color="green" size="regular">{matched} matched</Tag>
            {needsPick > 0 && <Tag color="orange" size="regular">{needsPick} to select</Tag>}
            {unmatched > 0 && <Tag color="red" size="regular">{unmatched} unmatched</Tag>}
            <span className="text-xs" style={{ color: TEXT_TERTIARY }}>· {onlineCount}/{matched} online</span>
            <div className="ml-auto">
              <Button type="text" leftIcon={ICONS.FUNCTIONAL_ADD} label="Add tester" onClick={() => setAddOpen((v) => !v)} />
            </div>
          </div>

          {addOpen && (
            <Card size={2}>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-56"><Input id="add-name" label="Tester name" value={newName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} placeholder="Full name" layout="vertical" /></div>
                <div className="w-64"><Input id="add-email" label="eero-account email" value={newEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)} placeholder="name@email.com" layout="vertical" /></div>
                <Button type="primary" label="Add" onClick={addTester} />
                <Button type="text" label="Cancel" onClick={() => { setAddOpen(false); setNewName(''); setNewEmail(''); }} />
              </div>
            </Card>
          )}

          <Card size={4}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${TRACK}`, color: TEXT_TERTIARY }}>
                    <th className={thCls}>Serial (DSN)</th>
                    <th className={thCls}>Tester</th>
                    <th className={thCls}>eero-account email</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => {
                    const sel = r.candidates.find((c) => c.serial === r.selectedSerial);
                    return (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${TRACK}` }}>
                        <td className={tdCls}>
                          {r.match === 'matched' && sel && (
                            <span className="flex items-center gap-2">
                              <span className="font-mono" style={{ color: ACCENT }}>{sel.serial}</span>
                              <Tag color="grey" size="regular">{sel.model}</Tag>
                            </span>
                          )}
                          {r.match === 'multiple' && (
                            <div className="w-64">
                              <Select
                                id={`pick-${r.id}`}
                                value=""
                                onChange={(v) => pickSerial(r.id, String(v))}
                                options={[{ value: '', label: `Pick ${model} unit…` }, ...r.candidates.map((c) => ({ value: c.serial, label: `${c.serial} · ${c.online ? 'online' : 'offline'}` }))]}
                              />
                            </div>
                          )}
                          {r.match === 'unmatched' && <span style={{ color: TEXT_TERTIARY }}>—</span>}
                        </td>
                        <td className={tdCls} style={{ color: TEXT_PRIMARY }}>{r.tester}</td>
                        <td className={tdCls} style={{ color: TEXT_SECONDARY }}>{r.email}</td>
                        <td className={tdCls}>
                          {r.match === 'matched' && sel && <Tag color={sel.online ? 'green' : 'orange'} size="regular">{sel.online ? 'online' : 'not online'}</Tag>}
                          {r.match === 'multiple' && <Tag color="orange" size="regular">pick device</Tag>}
                          {r.match === 'unmatched' && <Tag color="red" size="regular">no network found</Tag>}
                        </td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-2">
                            {r.match === 'matched' && sel && (
                              <div className="w-40">
                                <Select
                                  id={`act-${r.id}`}
                                  value=""
                                  onChange={(v) => rowAction(sel.serial, String(v))}
                                  options={[{ value: '', label: 'Select action…' }, { value: 'Return', label: 'Return' }, { value: 'Archive', label: 'Archive' }, { value: 'Brick & Return', label: 'Brick & Return' }]}
                                />
                              </div>
                            )}
                            {r.match === 'unmatched' && <Button type="default" label="Fix email" onClick={() => fixMatch(r.id)} />}
                            <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} ariaLabel="Remove tester" onClick={() => removeTester(r.id)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {roster.length === 0 && (
                    <tr><td className={tdCls} colSpan={5} style={{ color: TEXT_TERTIARY }}>No testers on this program yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function ProgramHealthView({ programs, surveys, onToast, onNewProgram, onNewSurvey, onDeleteProgram, onToggleStatus, onOpenDevices }: {
  programs: DemoProgram[];
  surveys: DemoSurvey[];
  onToast: (msg: string) => void;
  onNewProgram: () => void;
  onNewSurvey: (programId: string) => void;
  onDeleteProgram: (program: DemoProgram) => void;
  onToggleStatus: (program: DemoProgram) => void;
  onOpenDevices: (program: DemoProgram) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: TEXT_TERTIARY }}>Create and track beta programs here. Each program is the container you launch surveys into.</p>
        <div className="flex items-center gap-2">
          <Button type="primary" leftIcon={ICONS.FUNCTIONAL_ADD} label="New Program" onClick={onNewProgram} />
          <Button type="text" leftIcon={ICONS.FUNCTIONAL_DOWNLOAD} label="Export report" onClick={() => onToast('Exported program-health report to CSV (simulated)')} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {programs.map((p) => {
          const onlinePct = p.devicesDeployed > 0 ? Math.round((p.devicesOnline / p.devicesDeployed) * 100) : null;
          const healthy = p.surveyResponseRate >= 60 && (onlinePct === null || onlinePct >= 75);
          const surveyCount = surveys.filter((s) => s.programId === p.id).length;
          const noSurveys = p.status === 'active' && surveyCount === 0;
          return (
            <Card key={p.id} size={4}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-medium" style={{ color: TEXT_PRIMARY }}>{p.name}</span>
                  {programTag(p.type, p.type === 'feature' ? 'Feature' : 'Hardware')}
                  {p.type === 'hardware' && p.currentPhase && <Tag color="periwinkle-4" size="regular">Phase: {p.currentPhase}</Tag>}
                </div>
                {p.status === 'completed'
                  ? <Tag color="periwinkle" size="regular">Completed</Tag>
                  : surveyCount === 0
                    ? <Tag color="grey" size="regular">No surveys yet</Tag>
                    : p.surveyResponseRate === 0
                      ? <Tag color="grey" size="regular">Awaiting responses</Tag>
                      : <Tag color={healthy ? 'green' : 'orange'} size="regular">{healthy ? 'Healthy' : 'Needs attention'}</Tag>}
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Audience</p>
                  <p className="text-lg font-medium" style={{ color: TEXT_PRIMARY }}>{p.audienceSize} <span className="text-sm" style={{ color: TEXT_TERTIARY }}>testers</span></p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Devices online</p>
                  {p.type === 'feature'
                    ? <p className="text-lg font-medium" style={{ color: TEXT_PRIMARY }}>—</p>
                    : <button className="text-lg font-medium underline decoration-dotted underline-offset-4" style={{ color: ACCENT }} onClick={() => onOpenDevices(p)}>{onlinePct === null ? 'n/a' : `${onlinePct}%`}</button>}
                </div>
                <div className="col-span-2">
                  <p className="mb-1 text-xs" style={{ color: TEXT_TERTIARY }}>Survey response rate</p>
                  <ProgressBar className="w-full" label={`${p.surveyResponseRate}%`} percent={p.surveyResponseRate} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Avg feedback quality</p>
                  <p className="text-lg font-medium" style={{ color: TEXT_PRIMARY }}>{p.avgFeedbackQuality > 0 ? <>{p.avgFeedbackQuality.toFixed(1)} <span className="text-sm" style={{ color: TEXT_TERTIARY }}>/ 5</span></> : '—'}</p>
                </div>
              </div>
              {noSurveys && (
                <div className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'var(--ui-core-ocean-blue-ocean-1)', color: TEXT_SECONDARY }}>
                  Audience ready ({p.audienceSize} testers). This program has no surveys yet — add your first with <b style={{ color: TEXT_PRIMARY }}>“+ New survey”</b> to start collecting feedback.
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: TRACK }}>
                <div className="flex items-center gap-2">
                  {p.type === 'hardware' && <Button type="default" label="View devices" onClick={() => onOpenDevices(p)} />}
                  {p.status === 'active' && <Button type={noSurveys ? 'primary' : 'default'} leftIcon={ICONS.FUNCTIONAL_ADD} label="New survey" onClick={() => onNewSurvey(p.id)} />}
                  <Button type="text" leftIcon={p.status === 'active' ? ICONS.FUNCTIONAL_CHECK : ICONS.FUNCTIONAL_REFRESH} label={p.status === 'active' ? 'Close program' : 'Reopen'} onClick={() => onToggleStatus(p)} />
                </div>
                <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} label="Delete program" onClick={() => onDeleteProgram(p)} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Lifecycle legend + tab copy (states the model so nothing is inferred) ────
// One source of truth for the nav — the Segmented items and the per-tab blurb are
// both derived from this, so they can't drift out of sync.
const TABS = [
  { value: 'health', label: 'Programs', description: 'Programs are the long-lived containers. Create one (with its Qualtrics tester audience), then launch surveys into it over its lifecycle.' },
  { value: 'surveys', label: 'Surveys', description: 'Every survey that has run, grouped by program and phase. Recurring pulses show their waves; the phase timeline shows what ran when.' },
  { value: 'engagement', label: 'Engagement', description: 'Per-tester reliability and feedback quality, plus the At-Risk rules that flag testers to re-engage or reclaim.' },
] as const;

function LifecycleLegend() {
  const steps = [
    { label: 'Program', hint: 'the container' },
    { label: 'Phase', hint: 'EVT → DVT → PVT (hardware)' },
    { label: 'Survey', hint: 'OOBE · Performance · RTM…' },
    { label: 'Waves', hint: 'each weekly send; history kept' },
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-1 gap-y-2 rounded-lg border px-3 py-2" style={{ borderColor: TRACK, backgroundColor: 'var(--ui-background-bg-primary, #fff)' }}>
      <span className="mr-1 text-xs font-medium uppercase" style={{ color: TEXT_TERTIARY }}>How it fits together:</span>
      {steps.map((s, i) => (
        <span key={s.label} className="flex items-center gap-1">
          <span className="rounded-md px-2 py-1 text-xs" style={{ backgroundColor: 'var(--ui-core-periwinkle-periwinkle-1)', color: TEXT_SECONDARY }}>
            <b style={{ color: TEXT_PRIMARY }}>{s.label}</b> <span style={{ color: TEXT_TERTIARY }}>· {s.hint}</span>
          </span>
          {i < steps.length - 1 && <span style={{ color: TEXT_TERTIARY }}>›</span>}
        </span>
      ))}
    </div>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────
// ToastProvider must wrap the tree that calls useToast — so the page is a thin
// provider shell around the real content.
export default function DemoSurveysPage() {
  return <ToastProvider><DemoSurveysInner /></ToastProvider>;
}

export function DemoSurveysInner({ embedded = false }: { embedded?: boolean } = {}) {
  const [view, setView] = useState<string | number>('health');
  const [selected, setSelected] = useState<DemoSurvey | null>(null);
  // Programs & surveys are now stateful so a newly-created program/survey shows up live.
  const [openProgram, setOpenProgram] = useState<DemoProgram | null>(null);
  const [programs, setPrograms] = useState<DemoProgram[]>(INITIAL_PROGRAMS);
  const [surveys, setSurveys] = useState<DemoSurvey[]>(INITIAL_SURVEYS);
  const [newProgramOpen, setNewProgramOpen] = useState(false);
  // New Survey modal — optionally preselected to a program.
  const [newSurvey, setNewSurvey] = useState<{ open: boolean; programId?: string }>({ open: false });

  const { openToast } = useToast();
  const showToast = (msg: string) => openToast({ type: ToastType.success, description: msg });

  // Launch ONE survey INTO an existing program — the repeatable everyday path
  // (OOBE, weekly Performance, RTM, Re-setup…), each started individually when ready.
  // If the survey belongs to a later phase, the program advances to that phase.
  const handleCreateSurvey = (survey: DemoSurvey) => {
    setSurveys((prev) => [survey, ...prev]);
    if (survey.phase) {
      setPrograms((prev) => prev.map((p) => (p.id === survey.programId ? { ...p, currentPhase: survey.phase } : p)));
    }
    setSelected(null);
    setView('surveys');
    showToast(`Created "${survey.title}" for ${survey.programName}${survey.phase ? ` · ${survey.phase}` : ''}`);
    setNewSurvey({ open: false });
  };

  // New Program creates ONLY the container. Land on the Programs tab where the new
  // card exposes "+ New survey" — surveys are added there, one at a time, when ready.
  // (This is the single survey-creation path; the wizard no longer creates a survey.)
  // New Program sets up the program (+ audience) AND its first survey in one flow,
  // then drops you on that survey — so setup always produces something to work with.
  const handleCreateProgram = (program: DemoProgram, firstSurvey: DemoSurvey) => {
    setPrograms((prev) => [...prev, program]);
    setSurveys((prev) => [firstSurvey, ...prev]);
    setSelected(firstSurvey);
    setView('surveys');
    showToast(`Created ${program.name} (${program.audienceSize} testers) + first survey “${firstSurvey.title}”`);
    setNewProgramOpen(false);
  };

  const handleDeleteSurvey = (survey: DemoSurvey) => {
    if (!window.confirm(`Delete the survey “${survey.title}”? This can’t be undone.`)) return;
    setSurveys((prev) => prev.filter((s) => s.id !== survey.id));
    setSelected((cur) => (cur?.id === survey.id ? null : cur));
    showToast(`Deleted survey “${survey.title}”`);
  };

  // Close/reopen a program — "completed" ends the beta but keeps it (and its surveys)
  // on the record. This is the non-destructive counterpart to delete.
  const handleToggleProgramStatus = (program: DemoProgram) => {
    const next = program.status === 'active' ? 'completed' : 'active';
    setPrograms((prev) => prev.map((p) => (p.id === program.id ? { ...p, status: next } : p)));
    showToast(next === 'completed' ? `Closed ${program.name} — marked complete` : `Reopened ${program.name}`);
  };

  // Deleting a program cascades to its surveys (a program is the container for them).
  const handleDeleteProgram = (program: DemoProgram) => {
    const owned = surveys.filter((s) => s.programId === program.id).length;
    if (!window.confirm(`Delete “${program.name}”${owned ? ` and its ${owned} survey${owned === 1 ? '' : 's'}` : ''}? This can’t be undone.`)) return;
    setPrograms((prev) => prev.filter((p) => p.id !== program.id));
    setSurveys((prev) => prev.filter((s) => s.programId !== program.id));
    showToast(`Deleted ${program.name}${owned ? ` + ${owned} survey${owned === 1 ? '' : 's'}` : ''}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ui-background-bg-secondary, #f5f6f7)' }}>
      {/* Demo seam banner — standalone route only; hidden when embedded in the app */}
      {!embedded && (
        <div className="w-full px-6 py-2 text-center text-xs" style={{ backgroundColor: 'var(--ui-core-periwinkle-periwinkle-1)', color: 'var(--ui-core-periwinkle-periwinkle-8)' }}>
          DEMO PREVIEW · <b>/demo-surveys</b> · isolated from the live app · Qualtrics + Bedrock calls are simulated
        </div>
      )}

      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-medium" style={{ color: TEXT_PRIMARY }}>Surveys &amp; Engagement</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_TERTIARY }}>
            Feedback loop for beta &amp; dogfood programs — surveys via Qualtrics, joined to your testers, programs, and devices.
          </p>
        </header>

        {/* How it fits together — states the mental model instead of leaving newcomers to infer it */}
        <LifecycleLegend />

        <div className="mb-3">
          <Segmented
            value={view}
            onChange={(v) => { setView(v); setSelected(null); setOpenProgram(null); }}
            items={TABS.map((t) => ({ label: t.label, value: t.value }))}
          />
        </div>
        <p className="mb-5 text-sm" style={{ color: TEXT_TERTIARY }}>{TABS.find((t) => t.value === view)?.description}</p>

        {view === 'surveys' && (selected
          ? (selected.status === 'draft'
              ? <DraftPanel survey={selected} onBack={() => setSelected(null)} onDelete={() => handleDeleteSurvey(selected)} />
              : <SurveyResults survey={selected} onBack={() => setSelected(null)} onToast={showToast} onDelete={() => handleDeleteSurvey(selected)} />)
          : <SurveyList surveys={surveys} onSelect={setSelected} onNewSurvey={() => setNewSurvey({ open: true })} onDelete={handleDeleteSurvey} />)}
        {view === 'engagement' && <EngagementView onToast={showToast} />}
        {view === 'health' && (openProgram
          ? <ProgramDevicesView program={openProgram} onBack={() => setOpenProgram(null)} onToast={showToast} />
          : <ProgramHealthView
              programs={programs}
              surveys={surveys}
              onToast={showToast}
              onNewProgram={() => setNewProgramOpen(true)}
              onNewSurvey={(programId) => setNewSurvey({ open: true, programId })}
              onDeleteProgram={handleDeleteProgram}
              onToggleStatus={handleToggleProgramStatus}
              onOpenDevices={setOpenProgram}
            />
        )}
      </div>

      {newProgramOpen && (
        <NewProgramModal
          existingIds={programs.map((p) => p.id)}
          onCancel={() => setNewProgramOpen(false)}
          onCreate={handleCreateProgram}
        />
      )}

      {newSurvey.open && (
        <NewSurveyModal
          programs={programs}
          existingIds={surveys.map((s) => s.id)}
          existingKeys={surveys.map((s) => `${s.programId}|${s.kind}|${s.phase ?? 'none'}`)}
          defaultProgramId={newSurvey.programId}
          onCancel={() => setNewSurvey({ open: false })}
          onCreate={handleCreateSurvey}
        />
      )}
    </div>
  );
}

// ─── Import audience from Qualtrics (live directory lists) ───────────────────
interface QualtricsList { id: string; name: string; contactCount: number | null; source: string; }
interface QualtricsContact { email: string; firstName?: string; lastName?: string; }

const QUALTRICS_LISTS_URL = '/api/demo-qualtrics-lists';

// Shared Qualtrics access — used by both the Import tab and the New Program wizard,
// so the fetch shape / fallback lives in one place instead of being copy-pasted.
function useQualtricsLists() {
  const [lists, setLists] = useState<QualtricsList[]>([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(QUALTRICS_LISTS_URL)
      .then((r) => r.json())
      .then((d) => { setLists(d.lists || []); setSource(d.source || ''); })
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, []);
  return { lists, source, loading };
}

function fetchQualtricsContacts(listId: string): Promise<{ contacts: QualtricsContact[]; source: string }> {
  return fetch(`${QUALTRICS_LISTS_URL}?listId=${encodeURIComponent(listId)}`)
    .then((r) => r.json())
    .then((d) => ({ contacts: (d.contacts || []) as QualtricsContact[], source: d.source }));
}

// The library of Qualtrics survey definitions to point a program's survey at —
// this is the survey Insight collects responses from. Live with a seeded fallback.
interface QualtricsSurveyDef { id: string; name: string; isActive: boolean; }
function useQualtricsSurveys() {
  const [surveys, setSurveys] = useState<QualtricsSurveyDef[]>([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/demo-qualtrics-surveys')
      .then((r) => r.json())
      .then((d) => { setSurveys(d.surveys || []); setSource(d.source || ''); })
      .catch(() => setSurveys([]))
      .finally(() => setLoading(false));
  }, []);
  return { surveys, source, loading };
}

// ─── New Program flow (Details → optional audience → Review) ─────────────────
// Creates the program CONTAINER only — surveys are added separately via New Survey.
// All state is local to this modal; the created program is handed back via onCreate.
function slugify(name: string, existingIds: string[]) {
  const base = 'pg-' + (name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'program');
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function NewProgramModal({
  existingIds,
  onCancel,
  onCreate,
}: {
  existingIds: string[];
  onCancel: () => void;
  onCreate: (program: DemoProgram, firstSurvey: DemoSurvey) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — details
  const [name, setName] = useState('');
  const [product, setProduct] = useState('');
  const [type, setType] = useState<ProgramType>('hardware');
  const [startPhase, setStartPhase] = useState<Phase>('EVT'); // hardware only

  // Step 3 — first survey (mandatory; every new program starts with one survey)
  const [firstKind, setFirstKind] = useState<SurveyKind>('oobe');
  const [surveyTitle, setSurveyTitle] = useState(SURVEY_KINDS['oobe'].defaultTitle);
  const pickFirstKind = (k: SurveyKind) => { setFirstKind(k); setSurveyTitle(SURVEY_KINDS[k].defaultTitle); };

  // Step 2 — audience (live Qualtrics list import; reuses the shared hook/helper).
  // Testers auto-load the moment a list is picked — no separate "Import" button.
  const { lists, source: listsSource, loading: listsLoading } = useQualtricsLists();
  const [selectedList, setSelectedList] = useState('');
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audience, setAudience] = useState<{ listName: string; contacts: QualtricsContact[]; source: string } | null>(null);

  // Auto-load testers as soon as a list is chosen (clearing selection clears the audience).
  const selectList = (id: string) => {
    setSelectedList(id);
    if (!id) { setAudience(null); return; }
    setAudienceLoading(true);
    setAudience(null);
    const list = lists.find((l) => l.id === id);
    fetchQualtricsContacts(id)
      .then(({ contacts, source }) => setAudience({ listName: list?.name || '', contacts, source }))
      .catch(() => setAudience({ listName: list?.name || '', contacts: [], source: 'seed' }))
      .finally(() => setAudienceLoading(false));
  };

  const participants = audience?.contacts.length ?? 0;

  const create = () => {
    const id = slugify(name, existingIds);
    const phase = type === 'hardware' ? startPhase : undefined;
    const program: DemoProgram = {
      id,
      name: name.trim(),
      type,
      status: 'active',
      currentPhase: phase,
      audienceSize: participants,
      devicesDeployed: type === 'hardware' ? participants : 0,
      devicesOnline: 0,
      surveyResponseRate: 0,
      avgFeedbackQuality: 0,
    };
    const firstSurvey: DemoSurvey = {
      id: `${id}-${firstKind}-${phase ?? 'x'}`,
      title: surveyTitle.trim() || SURVEY_KINDS[firstKind].defaultTitle,
      description: `${SURVEY_KINDS[firstKind].label} survey for ${program.name}${phase ? ` · ${phase}` : ''}. Not yet distributed.`,
      status: 'draft',
      qualtricsId: `SV_draft_${id}`,
      programId: id,
      programName: program.name,
      programType: type,
      kind: firstKind,
      cadence: SURVEY_KINDS[firstKind].defaultCadence,
      phase,
      recipients: participants,
      responses: 0,
      avgCompletionMins: 0,
      questions: [{ id: 'q1', type: 'rating', title: 'Add your questions in Qualtrics', ratingCounts: [0, 0, 0, 0, 0] }],
    };
    onCreate(program, firstSurvey);
  };

  const stepLabels = ['Details', 'Audience', 'First survey'];
  // Every step is mandatory: name + product (step 1), a Qualtrics list with ≥1
  // tester (step 2), and a first-survey title (step 3). No skipping.
  const canAdvance =
    step === 1 ? name.trim().length > 0 && product.trim().length > 0
    : step === 2 ? !!audience && audience.contacts.length > 0
    : surveyTitle.trim().length > 0;

  return (
    <Modal
      isOpen
      title="New Program"
      onCancel={onCancel}
      onOk={() => (step < 3 ? setStep((s) => (s + 1) as 1 | 2 | 3) : create())}
      okText={step === 3 ? 'Create program & survey' : 'Next'}
      cancelText="Cancel"
      okButtonProps={{ disabled: !canAdvance }}
    >
      {/* Step indicator */}
      <div className="mb-4 flex items-center gap-2 text-xs">
        {stepLabels.map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={
                i + 1 === step
                  ? { backgroundColor: 'var(--ui-core-periwinkle-periwinkle-1)', color: 'var(--ui-core-periwinkle-periwinkle-8)' }
                  : { color: i + 1 < step ? 'var(--ui-core-green-green-6)' : TEXT_TERTIARY }
              }
            >
              {i + 1 < step ? '✓ ' : `${i + 1}. `}{l}
            </span>
            {i < stepLabels.length - 1 && <span style={{ color: TRACK }}>→</span>}
          </div>
        ))}
      </div>

      {/* Step 1 — Details */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            id="np-name"
            label="Program name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g. Foghorn Firmware Beta"
            layout="vertical"
          />
          <Input
            id="np-product"
            label="Product"
            value={product}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProduct(e.target.value)}
            placeholder="e.g. eero Max 7 / Firmware 7.2"
            layout="vertical"
          />
          <Select
            id="np-type"
            label="Program type"
            value={type}
            onChange={(v) => setType(v as ProgramType)}
            options={[
              { value: 'hardware', label: 'Hardware — devices are shipped and tracked' },
              { value: 'feature', label: 'Feature — no devices; participation + surveys are the interaction' },
            ]}
            layout="vertical"
          />
          {type === 'hardware' && (
            <Select
              id="np-phase"
              label="Starting phase"
              value={startPhase}
              onChange={(v) => setStartPhase(v as Phase)}
              options={PHASES.map((p) => ({ value: p, label: p }))}
              layout="vertical"
            />
          )}
          <p className="text-xs" style={{ color: TEXT_TERTIARY }}>
            {type === 'hardware'
              ? 'Hardware runs the full survey cycle once per phase (EVT → DVT → PVT). You can start new phases later.'
              : 'Feature programs ship no hardware and have no phases, so device counts show “—”. Both types can be surveyed.'}
          </p>
        </div>
      )}

      {/* Step 2 — Audience */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
            <b style={{ color: TEXT_PRIMARY }}>Required.</b> Pick the Qualtrics list of testers for this program — they load automatically and become its audience (the recipients for every survey you run). You can’t continue until a list with testers is loaded.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: TEXT_TERTIARY }}>Source:</span>
            {listsSource === 'live'
              ? <Tag color="green" size="regular" showIcon>Live · Qualtrics directory</Tag>
              : <Tag color="orange" size="regular">Seeded fallback</Tag>}
            <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{lists.length} lists available</span>
          </div>
          <Select
            id="np-list"
            label="Qualtrics list"
            value={selectedList}
            onChange={(v) => selectList(String(v))}
            layout="vertical"
            options={[
              { value: '', label: listsLoading ? 'Loading lists from Qualtrics…' : 'Select a list to load its testers…' },
              ...lists.map((l) => ({ value: l.id, label: l.contactCount ? `${l.name} (${l.contactCount})` : l.name })),
            ]}
          />

          {audienceLoading && (
            <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Loading testers from Qualtrics…</p>
          )}

          {!audienceLoading && audience && audience.contacts.length > 0 && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--ui-core-green-green-1)' }}>
              <p className="mb-2 text-sm" style={{ color: TEXT_SECONDARY }}>
                Loaded <b style={{ color: TEXT_PRIMARY }}>{audience.contacts.length}</b> testers from <b style={{ color: TEXT_PRIMARY }}>{audience.listName}</b>
                {' '}({audience.source === 'live' ? 'live' : 'seed'}) — matched to existing testers by email.
              </p>
              <div className="flex flex-col gap-0.5">
                {audience.contacts.slice(0, 4).map((c, i) => (
                  <span key={i} className="text-xs" style={{ color: TEXT_TERTIARY }}>
                    {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'} · {c.email}
                  </span>
                ))}
                {audience.contacts.length > 4 && (
                  <span className="text-xs" style={{ color: TEXT_TERTIARY }}>…and {audience.contacts.length - 4} more</span>
                )}
              </div>
            </div>
          )}

          {!audienceLoading && audience && audience.contacts.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--ui-core-orange-orange-6)' }}>
              This list returned no contacts via the API (a known Qualtrics quirk on some lists). Pick another list — a program needs a tester list to continue.
            </p>
          )}
        </div>
      )}

      {/* Step 3 — First survey (every program starts with one) */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border p-3" style={{ borderColor: TRACK }}>
            <div className="flex flex-col gap-1 text-sm" style={{ color: TEXT_SECONDARY }}>
              <div className="flex flex-wrap items-center gap-2"><b style={{ color: TEXT_PRIMARY }}>{name.trim()}</b>{programTag(type, type === 'feature' ? 'Feature' : 'Hardware')}{type === 'hardware' && phaseTag(startPhase)}</div>
              <div>Audience: <b style={{ color: TEXT_PRIMARY }}>{participants}</b> testers from {audience?.listName}</div>
            </div>
          </div>
          <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Pick the first survey to run for this program. You&apos;ll land on it next, and can add more anytime.</p>
          <Select
            id="np-first-kind"
            label="First survey type"
            value={firstKind}
            onChange={(v) => pickFirstKind(v as SurveyKind)}
            options={(Object.keys(SURVEY_KINDS) as SurveyKind[]).map((k) => ({ value: k, label: SURVEY_KINDS[k].label }))}
            layout="vertical"
          />
          <Input
            id="np-survey-title"
            label="Survey title"
            value={surveyTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSurveyTitle(e.target.value)}
            placeholder={SURVEY_KINDS[firstKind].defaultTitle || 'Survey title'}
            layout="vertical"
          />
          <p className="text-xs" style={{ color: TEXT_TERTIARY }}>
            Created for this program’s {participants} testers. You send it from <b>Qualtrics</b> as usual; responses are collected, pushed to Insight, and shown here and on the program card as they come in.
          </p>
        </div>
      )}

      {/* Back control */}
      {step > 1 && (
        <div className="mt-4">
          <Button type="text" label="← Back" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} />
        </div>
      )}
    </Modal>
  );
}

// ─── New Survey flow (launch ONE survey INTO an existing program) ─────────────
// The repeatable everyday path: OOBE, weekly Performance, RTM, Re-setup… each
// started individually when it's actually ready. No new program, no bulk sets.
// Programs are long-lived containers; this is how they accumulate surveys over
// their lifecycle/phases. Picking a later phase advances the program to it.
function NewSurveyModal({
  programs,
  existingIds,
  existingKeys,
  defaultProgramId,
  onCancel,
  onCreate,
}: {
  programs: DemoProgram[];
  existingIds: string[];
  existingKeys: string[];
  defaultProgramId?: string;
  onCancel: () => void;
  onCreate: (survey: DemoSurvey) => void;
}) {
  const [programId, setProgramId] = useState(defaultProgramId ?? programs[0]?.id ?? '');
  const program = programs.find((p) => p.id === programId);
  const isHardware = program?.type === 'hardware';

  const [phase, setPhase] = useState<Phase>(program?.currentPhase ?? 'EVT');
  const [kind, setKind] = useState<SurveyKind>('performance');
  const [cadence, setCadence] = useState<Cadence>(SURVEY_KINDS['performance'].defaultCadence);
  const [submitting, setSubmitting] = useState(false); // guards against a double-click creating two

  // The Qualtrics survey this collects from (what Insight pulls responses from).
  const { surveys: qSurveys, source: qSource, loading: qLoading } = useQualtricsSurveys();
  const [qualtricsSurveyId, setQualtricsSurveyId] = useState('');
  const chosen = qSurveys.find((s) => s.id === qualtricsSurveyId);

  const pickKind = (k: SurveyKind) => {
    setKind(k);
    setCadence(SURVEY_KINDS[k].defaultCadence);
  };

  const recipients = program?.audienceSize ?? 0; // the program's imported Qualtrics audience
  const ph = isHardware ? phase : undefined;
  // A same program + kind + phase survey already exists → likely an accidental repeat.
  const isDuplicate = !!program && existingKeys.includes(`${program.id}|${kind}|${ph ?? 'none'}`);
  const canCreate = !!program && !!chosen && !submitting;

  const create = () => {
    if (!program || !chosen || submitting) return;
    setSubmitting(true);
    const base = `${program.id}-${kind}-${ph ?? 'x'}`;
    let id = base, n = 2;
    while (existingIds.includes(id)) id = `${base}-${n++}`;
    onCreate({
      id,
      title: chosen.name, // the chosen Qualtrics survey is the source of record
      description: `${SURVEY_KINDS[kind].label} for ${program.name}${ph ? ` · ${ph}` : ''}. Collects from Qualtrics survey ${chosen.id} via Insight.`,
      status: 'draft',
      qualtricsId: chosen.id,
      programId: program.id,
      programName: program.name,
      programType: program.type,
      kind,
      cadence,
      phase: ph,
      recipients,
      responses: 0,
      avgCompletionMins: 0,
      questions: [{ id: 'q1', type: 'rating', title: 'Responses sync from Qualtrics via Insight', ratingCounts: [0, 0, 0, 0, 0] }],
    });
  };

  return (
    <Modal
      isOpen
      title="New Survey"
      onCancel={onCancel}
      onOk={create}
      okText={submitting ? 'Creating…' : 'Create survey'}
      cancelText="Cancel"
      okButtonProps={{ disabled: !canCreate }}
    >
      <div className="space-y-4">
        <Select
          id="ns-program"
          label="Program"
          value={programId}
          onChange={(v) => { setProgramId(String(v)); const pg = programs.find((p) => p.id === String(v)); if (pg?.currentPhase) setPhase(pg.currentPhase); }}
          options={programs.map((p) => ({ value: p.id, label: p.name }))}
          layout="vertical"
        />

        {isHardware ? (
          <Select
            id="ns-phase"
            label="Phase"
            value={phase}
            onChange={(v) => setPhase(v as Phase)}
            options={PHASES.map((p) => ({ value: p, label: p }))}
            layout="vertical"
          />
        ) : (
          <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Feature/software program — no phases.</p>
        )}

        <div>
          <Select
            id="ns-qsurvey"
            label="Qualtrics survey (source for Insight)"
            value={qualtricsSurveyId}
            onChange={(v) => setQualtricsSurveyId(String(v))}
            showSearch
            filterOption={(input: string, option: any) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={[
              { value: '', label: qLoading ? 'Loading surveys from Qualtrics…' : 'Type to search & select a Qualtrics survey…' },
              ...qSurveys.map((s) => ({ value: s.id, label: s.isActive ? s.name : `${s.name} (inactive)` })),
            ]}
            layout="vertical"
          />
          <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: TEXT_TERTIARY }}>
            The survey Insight collects responses from — start typing to filter.
            {qSource === 'live'
              ? <Tag color="green" size="regular" showIcon>Live · {qSurveys.length} surveys</Tag>
              : <Tag color="orange" size="regular">Seeded · {qSurveys.length} surveys</Tag>}
          </p>
        </div>
        <Select
          id="ns-kind"
          label="Survey type (for grouping & tags)"
          value={kind}
          onChange={(v) => pickKind(v as SurveyKind)}
          options={(Object.keys(SURVEY_KINDS) as SurveyKind[]).map((k) => ({ value: k, label: SURVEY_KINDS[k].label }))}
          layout="vertical"
        />
        <Select
          id="ns-cadence"
          label="Cadence"
          value={cadence}
          onChange={(v) => setCadence(v as Cadence)}
          options={[
            { value: 'recurring', label: 'Recurring (e.g. weekly performance pulse)' },
            { value: 'one_off', label: 'One-off (e.g. OOBE, RTM, re-setup)' },
          ]}
          layout="vertical"
        />
        {isDuplicate && (
          <p className="flex items-start gap-1.5 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--ui-core-orange-orange-1)', color: 'var(--ui-core-orange-orange-7)' }}>
            <Icon icon={ICONS.FUNCTIONAL_WARNINGREGULAR} className="mt-0.5 h-4 w-4 shrink-0" />
            <span>A <b>{SURVEY_KINDS[kind].label}</b> survey already exists for {program?.name}{isHardware ? ` · ${phase}` : ''}. Create another only if you really mean to run a second one.</span>
          </p>
        )}
        <p className="text-xs" style={{ color: TEXT_TERTIARY }}>
          Created as a <b>draft</b> targeting {program?.name}{isHardware ? ` · ${phase}` : ''} (recipients = {recipients || 'audience TBD'}). Start each survey when it&apos;s ready — one at a time.
        </p>
      </div>
    </Modal>
  );
}
