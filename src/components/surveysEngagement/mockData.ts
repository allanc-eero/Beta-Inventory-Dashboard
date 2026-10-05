// Seed fallback + showcase program wiring for the live demo. Seed data is only
// used when the live Qualtrics call can't run (no creds / missing response-read
// scope / offline) — the standard demo seam. The showcase program binds to REAL
// Merci 10.3 survey ids so "Generate" pulls live data when the token allows.
import { DemoProgram, LiveSurveyListItem, LiveReport } from './types';

// Real Merci 10.3 surveys (verified via the live Qualtrics account).
export const DEMO_PROGRAMS: DemoProgram[] = [
  {
    id: 'merci', name: 'Merci 10.3 Beta',
    surveys: [
      { localId: 'm-oobe', qualtricsId: 'SV_0Bv2TV4c3VtgjCS', name: '[Merci 10.3 PVT - Mahalo] OOBE/Setup Survey', milestone: 'oobe', phase: 'PVT' },
      { localId: 'm-weekly', qualtricsId: 'SV_40YxW3ytA2lLiu2', name: '[Merci 10.3 EB2 PVT] Weekly Performance Testing', milestone: 'weekly', phase: 'PVT' },
      { localId: 'm-rtm', qualtricsId: 'SV_0TfYO9G20q6lxPM', name: 'Merci 10 Weekly Performance Survey - RTM Testing', milestone: 'rtm', phase: 'DVT' },
    ],
  },
];

// Seed survey list (used only if the live /surveys call fails).
export const SEED_SURVEYS: LiveSurveyListItem[] = [
  { id: 'SV_0Bv2TV4c3VtgjCS', name: '[Merci 10.3 PVT - Mahalo] OOBE/Setup Survey', isActive: true },
  { id: 'SV_40YxW3ytA2lLiu2', name: '[Merci 10.3 EB2 PVT] Weekly Performance Testing', isActive: true },
  { id: 'SV_0TfYO9G20q6lxPM', name: 'Merci 10 Weekly Performance Survey - RTM Testing', isActive: true },
];

// Minimal seed report so the UI renders when live data isn't reachable.
export function seedReport(surveyId: string, from: string, to: string, notice: string): LiveReport {
  const name = SEED_SURVEYS.find((s) => s.id === surveyId)?.name || surveyId;
  return {
    surveyId, surveyName: name, from, to,
    recipients: 3, responders: 3, completed: 3, completeRate: 100,
    overallAvg5: 3.7, flaggedCount: 1,
    scaleQuestions: [
      { id: 'QID38', prompt: 'How satisfied are you with your eero Wi-Fi network performance?', kind: 'scale', n: 3, avg: 3.7, scaleMax: 5, avg5: 3.7, distribution: [0, 1, 0, 1, 1], flagged: false },
      { id: 'QID41', prompt: 'How satisfied are you with your eero network stability?', kind: 'scale', n: 3, avg: 3, scaleMax: 5, avg5: 3, distribution: [0, 1, 1, 1, 0], flagged: true },
    ],
    choiceQuestions: [
      { id: 'QID49', prompt: 'Have you noticed any new Wi-Fi coverage issues?', kind: 'single', n: 3, breakdown: [{ label: 'No', count: 2, pct: 67 }, { label: 'Yes', count: 1, pct: 33 }] },
    ],
    textQuestions: [
      { id: 'QID51', prompt: 'Is there anything else you would like us to know?', kind: 'text', n: 2, verbatims: [{ name: 'Ken MacInnis', text: 'the swap was seamless & unit performing optimally' }, { name: 'Dana Wu', text: 'Some device disconnects, ticket is open.' }] },
    ],
    flaggedResponders: [
      { name: 'Dana Wu', email: 'dwu@example.com', platform: 'Android', group: 'Kunka', recordedDate: to, avg5: 2.5, lowAreas: ['How satisfied are you with your eero network stability?'], verbatim: 'Some device disconnects, ticket is open.' },
    ],
    platformBreakdown: [{ label: 'iOS', count: 2, pct: 67 }, { label: 'Android', count: 1, pct: 33 }],
    source: 'seed', notice,
  };
}
