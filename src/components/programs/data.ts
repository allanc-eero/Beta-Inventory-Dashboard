// Seed/mock data for the Programs feature — realistic so the demo tells a story.
// INITIAL_* seed page-level state so newly-created programs/surveys show up live.
// The AI_SUMMARIES map is the canned fallback used when SUMMARIZE_LIVE is off;
// live summaries come from /api/summarize (Bedrock).
import type { SurveyKind, Cadence, Phase, DemoSurvey, DemoTester, DemoProgram, TechnicalLevel } from './types';
import type { AISummary, Tone, Severity, Priority } from '@/lib/summarize';

// Survey-kind metadata: label, default title + cadence. Drives the pickers and tags.
export const SURVEY_KINDS: Record<SurveyKind, { label: string; defaultTitle: string; defaultCadence: Cadence }> = {
  oobe:        { label: 'OOBE / Setup',         defaultTitle: 'Setup Experience',   defaultCadence: 'one_off' },
  packaging:   { label: 'Packaging / Unboxing', defaultTitle: 'Packaging Feedback', defaultCadence: 'one_off' },
  performance: { label: 'Weekly experience',    defaultTitle: 'Weekly Check-in',    defaultCadence: 'recurring' },
  rtm:         { label: 'RTM testing',          defaultTitle: 'RTM Validation',     defaultCadence: 'one_off' },
  resetup:     { label: 'Re-setup',             defaultTitle: 'Re-setup Test',      defaultCadence: 'one_off' },
  final:       { label: 'Final Summary',        defaultTitle: 'Final Summary',      defaultCadence: 'one_off' },
  custom:      { label: 'Custom',               defaultTitle: '',                   defaultCadence: 'one_off' },
};

export const PHASES: Phase[] = ['EVT', 'DVT', 'PVT'];

export const INITIAL_SURVEYS: DemoSurvey[] = [
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

export const TESTERS: DemoTester[] = [
  { id: 't1', name: 'Diego Kim', email: 'diego.kim@eero.com', programName: 'Foghorn Firmware Beta', technicalLevel: 'Advanced', reliability: 92, avgResponseDays: 1.2, feedbackQuality: 5, deviceOnline: null, missedSurveys: 0 },
  { id: 't2', name: 'Aaron Rivera', email: 'aaron@eero.com', programName: 'Merci Beta', technicalLevel: 'Intermediate', reliability: 78, avgResponseDays: 2.4, feedbackQuality: 4, deviceOnline: true, missedSurveys: 1 },
  { id: 't3', name: 'Philip Rivera', email: 'philip.rivera@eero.com', programName: 'Merci Beta', technicalLevel: 'Advanced', reliability: 64, avgResponseDays: 3.1, feedbackQuality: 4, deviceOnline: true, missedSurveys: 2 },
  { id: 't4', name: 'Layton Hill', email: 'layton.hill@eero.com', programName: 'Foghorn Firmware Beta', technicalLevel: 'Advanced', reliability: 88, avgResponseDays: 1.6, feedbackQuality: 5, deviceOnline: null, missedSurveys: 0 },
  { id: 't5', name: 'Matthew Mullin', email: 'matthew.mullin@eero.com', programName: 'Merci Beta', technicalLevel: 'Beginner', reliability: 25, avgResponseDays: 9.0, feedbackQuality: 2, deviceOnline: false, missedSurveys: 4 },
  { id: 't6', name: 'John Pelebo', email: 'john.pelebo@eero.com', programName: 'Outdoor Dogfood', technicalLevel: 'Intermediate', reliability: 18, avgResponseDays: 12.0, feedbackQuality: 1, deviceOnline: false, missedSurveys: 5 },
  { id: 't7', name: 'Stacia Wong', email: 'stacia@eero.com', programName: 'Outdoor Dogfood', technicalLevel: 'Advanced', reliability: 95, avgResponseDays: 0.9, feedbackQuality: 5, deviceOnline: true, missedSurveys: 0 },
  { id: 't8', name: 'Lalitha Rao', email: 'lalitha@eero.com', programName: 'Merci Beta', technicalLevel: 'Intermediate', reliability: 29, avgResponseDays: 8.2, feedbackQuality: 2, deviceOnline: false, missedSurveys: 3 },
  // Device-less roster fillers so a real-sized roster pages through (numbered
  // page menu needs >1 page). noSeedDevice keeps them out of the device store,
  // so Devices/People/Locations counts are unchanged — they read "awaiting devices".
  ...makeRosterFillers('Merci Beta', 18, 0),
];

export function makeRosterFillers(programName: string, count: number, startIdx: number): DemoTester[] {
  const first = ['Ava', 'Liam', 'Noah', 'Emma', 'Mia', 'Ethan', 'Sofia', 'Lucas', 'Zoe', 'Kai', 'Nina', 'Omar', 'Priya', 'Ravi', 'Tara', 'Uma', 'Wei', 'Yara', 'Diego', 'Elena'];
  const last = ['Park', 'Nguyen', 'Silva', 'Khan', 'Meyer', 'Rossi', 'Cohen', 'Ito', 'Adams', 'Bauer', 'Costa', 'Duran', 'Frost', 'Gupta', 'Haas', 'Ivanov', 'Jung', 'Klein', 'Lopez', 'Mora'];
  const levels: TechnicalLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  return Array.from({ length: count }, (_, i) => {
    const k = startIdx + i;
    const name = `${first[k % first.length]} ${last[(k * 3) % last.length]}`;
    const handle = name.toLowerCase().replace(/[^a-z]+/g, '.');
    return {
      id: `filler-${programName.replace(/\s+/g, '-').toLowerCase()}-${k}`,
      name,
      email: `${handle}@eero.com`,
      programName,
      technicalLevel: levels[k % 3],
      reliability: 60 + (k * 7) % 40,
      avgResponseDays: 1 + (k % 5),
      feedbackQuality: 3 + (k % 3),
      deviceOnline: null,
      missedSurveys: k % 3,
      noSeedDevice: true,
    };
  });
}

export const INITIAL_PROGRAMS: DemoProgram[] = [
  { id: 'pg-merci-beta', name: 'Merci Beta', type: 'hardware', status: 'active', currentPhase: 'DVT', audienceSize: 62, devicesDeployed: 62, devicesOnline: 51, surveyResponseRate: 63, avgFeedbackQuality: 3.8, testers: TESTERS.filter((t) => t.programName === 'Merci Beta') },
  { id: 'pg-outdoor-df', name: 'Outdoor Dogfood', type: 'hardware', status: 'completed', currentPhase: 'PVT', audienceSize: 30, devicesDeployed: 30, devicesOnline: 22, surveyResponseRate: 90, avgFeedbackQuality: 4.4, testers: TESTERS.filter((t) => t.programName === 'Outdoor Dogfood') },
  { id: 'pg-foghorn-fw', name: 'Foghorn Firmware Beta', type: 'feature', status: 'active', audienceSize: 48, devicesDeployed: 0, devicesOnline: 0, surveyResponseRate: 85, avgFeedbackQuality: 4.6, testers: TESTERS.filter((t) => t.programName === 'Foghorn Firmware Beta') },
  { id: 'pg-app-beta', name: 'App Experience Beta', type: 'feature', status: 'active', audienceSize: 24, devicesDeployed: 0, devicesOnline: 0, surveyResponseRate: 0, avgFeedbackQuality: 0, testers: TESTERS.filter((t) => t.programName === 'App Experience Beta') },
];

// Flattened roster for global People seeding — every program's REAL testers as
// {name, email, program}. Fillers (noSeedDevice) are pagination-only and excluded.
export const ROSTER_SEED: { name: string; email: string; program: string }[] = INITIAL_PROGRAMS.flatMap((p) =>
  p.testers.filter((t) => !t.noSeedDevice).map((t) => ({ name: t.name, email: t.email, program: p.name })),
);

// Emails of the filler testers — used once to purge any fillers previously seeded.
export const FILLER_EMAILS: string[] = Array.from(new Set(
  INITIAL_PROGRAMS.flatMap((p) => p.testers.filter((t) => t.noSeedDevice).map((t) => t.email.toLowerCase())),
));

// ─── AI feedback summaries (canned demo fallback for /api/summarize) ─────────
export const AI_SUMMARIES: Record<string, AISummary> = {
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

export const TONE_COLOR: Record<Tone, string> = {
  positive: 'var(--ui-core-green-green-6)',
  neutral: 'var(--ui-core-gray-gray-5)',
  negative: 'var(--ui-core-red-red-6)',
};
export const SEVERITY_TAG: Record<Severity, { color: 'red' | 'orange' | 'grey'; label: string }> = {
  high: { color: 'red', label: 'High' },
  medium: { color: 'orange', label: 'Medium' },
  low: { color: 'grey', label: 'Low' },
};
export const PRIORITY_TAG: Record<Priority, 'red' | 'orange' | 'grey'> = { P0: 'red', P1: 'orange', P2: 'grey' };
