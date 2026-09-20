'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Programs — Surveys, Engagement & Program Health
 * ─────────────────────────────────────────────────────────────────────────────
 * The in-app "Programs" tab (and the standalone /programs route). Renders four
 * views:
 *   1. Surveys        — list + results (charts + AI feedback summary + closed-loop
 *                       "create JIRA ticket" from a response). Qualtrics-backed.
 *   2. Engagement     — reliability / response-time / feedback-quality per tester,
 *                       plus an At-Risk view (rules engine + AI narration).
 *   3. Program Health — the leadership report: deployed, % online, response rate,
 *                       feedback quality per program (Hardware AND Feature programs).
 *   4. Device roster  — per-program serial↔tester assignment; writes into the shared
 *                       deviceStore so the same devices surface in Devices / People /
 *                       Locations (see ProgramDevicesView's shared-store bridge).
 *
 * Integration seams (Qualtrics / Bedrock / eero API) are env-gated: live when their
 * env vars are set, else a deterministic seed so the app always works. Items still
 * labelled "simulated" are awaiting those creds — see docs/Surveys_Feature_Handoff.md.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Card, Button, Tag, Segmented, Select, ProgressBar, Input, Modal,
  Icon, ICONS, TableV2, useToast, ToastType,
  Pagination,
} from '@amzn/eero-web-design-components';
// Shared device store — assigning serials in a Program writes real Device rows
// here, so the same devices surface in the Devices / People / Locations menus.
// (This is the "shared model" wiring; see the handoff doc's simulation note.)
import { useDeviceStore } from '@/store/deviceStore';
import { useUiStore } from '@/store/uiStore';
import DeviceDetailPanel from '../DeviceDetailPanel';
import { Device, Program, DeviceStatus } from '@/types';
import { ENGAGEMENT_LIVE, fetchLiveEngagement, LiveEngagement } from '@/lib/engagement';
import { AISummary, SUMMARIZE_LIVE, fetchSummary, SummaryResponseInput } from '@/lib/summarize';
import { adminUserUrl, insightNetworkUrl, adminNetworkUrl, resolveEnv, EeroEnv } from '@/lib/format';
import type {
  ProgramType, SurveyStatus, QuestionType, TechnicalLevel, SurveyKind, Cadence, Phase,
  DemoQuestion, SurveyWave, DemoSurvey, DemoTester, DemoProgram,
  MatchState, RosterCandidate, RosterEntry, DeviceLiveStatus, AssignedDevice,
} from './types';
import {
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TRACK,
  OK_GREEN, WARN_ORANGE, BAD_RED, ACCENT, RATING_BAR_COLORS, CHOICE_BAR_COLORS,
} from './theme';
import {
  SURVEY_KINDS, PHASES, INITIAL_SURVEYS, TESTERS, INITIAL_PROGRAMS,
  ROSTER_SEED, FILLER_EMAILS, AI_SUMMARIES, TONE_COLOR, SEVERITY_TAG, PRIORITY_TAG,
} from './data';

// Types live in ./types. Survey-kind metadata below drives the pickers and tags.
// Seed data (SURVEY_KINDS, PHASES, INITIAL_SURVEYS, TESTERS, INITIAL_PROGRAMS,
// ROSTER_SEED, FILLER_EMAILS) lives in ./data — imported at the top of this file.

// Turn a real Qualtrics contact into a program tester. The identity (name/email)
// is REAL (from the live Qualtrics list); engagement metrics are deterministically
// simulated from the email until survey-response data is wired in — so a real
// roster gets stable, plausible numbers instead of placeholders.
function contactToTester(
  contact: { email: string; firstName?: string; lastName?: string },
  program: { id: string; name: string; type: ProgramType },
): DemoTester {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || contact.email.split('@')[0];
  const seed = hashSeed(contact.email);
  const levels: TechnicalLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  return {
    id: `${program.id}-${contact.email}`,
    name,
    email: contact.email,
    programName: program.name,
    technicalLevel: levels[seed % 3],
    reliability: 40 + (seed % 60),                                  // 40–99%
    avgResponseDays: Math.round(((seed % 50) / 10 + 0.5) * 10) / 10, // 0.5–5.4d
    feedbackQuality: 3 + (seed % 3),                                // 3–5
    deviceOnline: program.type === 'feature' ? null : seed % 4 !== 0, // ~75% online (hardware)
    missedSurveys: seed % 4,                                        // 0–3
  };
}

// ─── Per-program device roster — the Insight identity-match surface ──────────
// PRODUCTION MODEL (simulated here behind the same demo seam as everything else):
//   Qualtrics roster (tester + eero-account email)
//     → match email against Insight (email → network → beta-model eeros)
//       → the tester's candidate DSN(s) + live status
//         → pick the beta unit (auto-filtered by model; select when ambiguous)
// The result is exactly the "user + DSN per program" table you drill into from a
// program card. `match` captures the three real-world outcomes of the email match.
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

// ─── AI feedback summary ──────────────────────────────────────────────────────
// Types (AISummary/Tone/Severity/Priority) now live in src/lib/summarize.ts so the
// AI_SUMMARIES (canned fallback) + TONE_COLOR / SEVERITY_TAG / PRIORITY_TAG live in ./data.

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

function AISummaryPanel({ survey }: { survey: DemoSurvey }) {
  const canned = AI_SUMMARIES[survey.id];
  const textResponses: SummaryResponseInput[] = survey.questions
    .flatMap((q) => q.textResponses || [])
    .map((r) => ({ tester: r.tester, text: r.text, sentiment: r.sentiment }));
  const responsesCount = survey.responses;

  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [summary, setSummary] = useState<AISummary | null>(null);

  // Nothing to summarize — no canned demo summary and no collected responses.
  if (!canned && textResponses.length === 0) {
    return <p className="text-sm" style={{ color: TEXT_TERTIARY }}>No responses yet — AI summary available once this survey collects feedback.</p>;
  }

  const generate = () => {
    setState('loading');
    // Live (Bedrock) or any survey without a canned summary → hit /api/summarize
    // (real Bedrock when configured, computed fallback otherwise). Canned demo
    // surveys with the flag off just replay the seeded summary.
    if (SUMMARIZE_LIVE || !canned) {
      fetchSummary({ surveyId: survey.id, surveyTitle: survey.title, responses: textResponses, previousTrend: canned?.trend })
        .then((s) => { setSummary(s); setState('done'); })
        .catch(() => { if (canned) { setSummary(canned); setState('done'); } else { setState('error'); } });
    } else {
      simulate(canned).then((s) => { setSummary(s); setState('done'); });
    }
  };

  if (state === 'idle') {
    return (
      <div className="flex items-center gap-3">
        <Button type="default" leftIcon={ICONS.FUNCTIONAL_INSIGHTAI} label="Generate AI Summary" onClick={generate} />
        <span className="text-xs" style={{ color: TEXT_TERTIARY }}>Reads every response via Bedrock and writes the briefing below{SUMMARIZE_LIVE ? '' : ' (simulated)'}</span>
      </div>
    );
  }

  if (state === 'loading') {
    return <p className="text-sm" style={{ color: TEXT_SECONDARY }}>Reading {responsesCount} responses and summarizing…</p>;
  }

  if (state === 'error' || !summary) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'var(--ui-core-red-red-6)' }}>Couldn&apos;t generate the summary.</span>
        <Button type="text" label="Retry" onClick={generate} />
      </div>
    );
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium" style={{ color: TEXT_TERTIARY }}>{r.tester}</span>
                  <p className="mt-1 text-sm leading-snug" style={{ color: TEXT_SECONDARY }}>{r.text}</p>
                </div>
                {/* Sentiment tag + any call-to-action stacked together on the right */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {sentimentTag(r.sentiment)}
                  {r.sentiment === 'negative' && (
                    <Button type="text" leftIcon={ICONS.FUNCTIONAL_TAG} label="Create JIRA ticket" onClick={() => onCreateTicket(r.text)} />
                  )}
                </div>
              </div>
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
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile value={recipients} label="Recipients" />
        <StatTile value={responses} label={selectedWave ? `Responses · ${selectedWave.label}` : 'Responses'} accent="var(--ui-core-periwinkle-periwinkle-6)" />
        <StatTile value={`${responseRate}%`} label="Response rate" accent={responseRate >= 70 ? 'var(--ui-core-green-green-6)' : 'var(--ui-core-orange-orange-6)'} />
        <StatTile value={`${survey.avgCompletionMins}m`} label="Avg completion" />
      </div>

      {/* AI summary */}
      <Card size={4} title={<span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>AI Feedback Summary</span>}>
        <AISummaryPanel survey={survey} />
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
      {/* Same spacing + column style as the program cards */}
      <div className="flex items-start gap-x-4 py-3">
        <div className="min-w-0 flex-[2] leading-snug">
          <button className="block max-w-full truncate text-left text-sm font-medium hover:underline" style={{ color: ACCENT }} onClick={() => onSelect(s)}>{s.title}</button>
          <p className="mt-0.5 truncate text-xs" style={{ color: TEXT_TERTIARY }}>
            {SURVEY_KINDS[s.kind].label} · {s.cadence === 'recurring' ? 'Recurring' : 'One-off'}{s.phase ? ` · ${s.phase}` : ''}
          </p>
        </div>
        <div className="flex-1"><HealthMetric label="Questions">{s.questions.length}</HealthMetric></div>
        <div className="flex-1"><HealthMetric label="Latest wave">{waveCount > 0 && wave ? `${wave.label} · ${fmtDate(wave.date)}` : '—'}</HealthMetric></div>
        <div className="flex-1"><HealthMetric label="Responses">{s.status === 'draft' ? '—' : `${responses}/${recipients} (${r}%)`}</HealthMetric></div>
        <div className="flex flex-1 items-center justify-end gap-2">
          {statusTag(s.status)}
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
    <div className="flex flex-col gap-4">
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
            <div className="flex flex-wrap items-center gap-2 border-b pb-1.5" style={{ borderColor: TRACK }}>
              <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{programName}</span>
              <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{group.length} survey{group.length === 1 ? '' : 's'}</span>
            </div>

            {orderedPhases.map((ph) => {
              const inPhase = group.filter((s) => (ph === 'none' ? !s.phase : s.phase === ph));
              if (inPhase.length === 0) return null;
              return (
                <div key={ph} className="flex flex-col gap-3">
                  {inPhase.map((s) => <SurveyCard key={s.id} s={s} onSelect={onSelect} onDelete={onDelete} />)}
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

function EngagementView({ programs, onToast }: { programs: DemoProgram[]; onToast: (msg: string) => void }) {
  const [narration, setNarration] = useState<'idle' | 'loading' | 'done'>('idle');

  // Live engagement overlay — when ENGAGEMENT_LIVE, real Qualtrics response data
  // (ingested via the completedResponse webhook) overrides the simulated per-tester
  // metrics, matched by email. Off → the roster keeps its simulated numbers.
  const [liveEngagement, setLiveEngagement] = useState<Record<string, LiveEngagement>>({});
  useEffect(() => {
    if (!ENGAGEMENT_LIVE) return;
    let cancelled = false;
    fetchLiveEngagement()
      .then((feed) => { if (!cancelled) setLiveEngagement(feed.byEmail || {}); })
      .catch(() => { if (!cancelled) setLiveEngagement({}); });
    return () => { cancelled = true; };
  }, []);

  const effectivePrograms = useMemo(() => programs.map((p) => ({
    ...p,
    testers: p.testers.map((t) => {
      const e = liveEngagement[t.email.toLowerCase()];
      return e ? { ...t, reliability: e.reliability, avgResponseDays: e.avgResponseDays, feedbackQuality: e.feedbackQuality, missedSurveys: e.missedSurveys } : t;
    }),
  })), [programs, liveEngagement]);

  // Rules engine — deterministic, explainable. AI only narrates the output.
  const isAtRisk = (t: DemoTester) => {
    const offline = t.deviceOnline === false;             // hardware: device offline
    const unresponsive = t.missedSurveys >= 3;            // missed 3+ surveys
    const lowReliability = t.reliability < 30;            // reliability under 30%
    return (offline || t.deviceOnline === null) && unresponsive && lowReliability;
  };

  // Roster comes from each program's testers (real Qualtrics contacts for programs
  // created from a live list; sampled seed for the example programs). Engagement
  // metrics are the live overlay when available, else simulated. Grouped by program.
  const atRisk = useMemo(() => effectivePrograms.flatMap((p) => p.testers).filter(isAtRisk), [effectivePrograms]);
  const atRiskByProgram = useMemo(
    () => effectivePrograms.map((p) => ({ name: p.name, testers: p.testers.filter(isAtRisk) })).filter((g) => g.testers.length > 0),
    [effectivePrograms],
  );
  const engagementByProgram = useMemo(
    () => effectivePrograms.map((p) => ({ name: p.name, testers: p.testers })).filter((g) => g.testers.length > 0),
    [effectivePrograms],
  );

  // Engagement columns — Program column dropped since rows are grouped under a program header.
  const engagementColumns = [
    { accessorKey: 'name', header: 'Tester', cell: (c: any) => <span style={{ color: TEXT_PRIMARY }}>{c.row.original.name}</span> },
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
  ] as any;

  return (
    <div className="flex flex-col gap-4">
      {/* At-Risk — grouped by program */}
      <Card size={2} title={<span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: TEXT_PRIMARY }}><span style={{ color: WARN_ORANGE }}><Icon icon={ICONS.FUNCTIONAL_WARNINGREGULAR} className="h-4 w-4" /></span>At-Risk / Action Needed</span>}>
        <p className="mb-3 text-xs" style={{ color: TEXT_TERTIARY }}>
          Rules: (device offline <b>or</b> feature program) · missed ≥3 surveys · reliability &lt; 30%. The intersection of device status and survey engagement — the reason to merge these two apps.
        </p>
        {atRisk.length === 0 ? (
          <p className="text-sm" style={{ color: TEXT_TERTIARY }}>No at-risk testers right now.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {atRiskByProgram.map((g) => (
              <div key={g.name} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b pb-1.5" style={{ borderColor: TRACK }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>{g.name}</span>
                  <span className="text-xs" style={{ color: TEXT_TERTIARY }}>· {g.testers.length} at risk</span>
                </div>
                {g.testers.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--ui-core-red-red-3)', backgroundColor: 'var(--ui-core-red-red-1)' }}>
                    <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{t.name}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.deviceOnline === false && <Tag color="red" size="regular">Device offline</Tag>}
                      <Tag color="orange" size="regular">{t.missedSurveys} missed surveys</Tag>
                      <Tag color="grey" size="regular">{t.reliability}% reliability</Tag>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

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

      {/* Engagement — grouped by program (EDS TableV2 per program) */}
      <Card size={2} title={<span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Tester Engagement</span>}>
        <p className="mb-3 text-xs" style={{ color: TEXT_TERTIARY }}>Derived from survey activity — engagement is computed from response reliability and missed surveys. Grouped by program.</p>
        <div className="flex flex-col gap-5">
          {engagementByProgram.map((g) => (
            <div key={g.name} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b pb-1.5" style={{ borderColor: TRACK }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_SECONDARY }}>{g.name}</span>
                <span className="text-xs" style={{ color: TEXT_TERTIARY }}>· {g.testers.length} testers</span>
              </div>
              <TableV2 data={g.testers} emptyText="No testers" columns={engagementColumns} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const COUNTRY_POOL = [
  { name: 'Australia', code: 'AUS' }, { name: 'United States', code: 'USA' },
  { name: 'United Kingdom', code: 'GBR' }, { name: 'Germany', code: 'DEU' },
  { name: 'Canada', code: 'CAN' }, { name: 'Japan', code: 'JPN' },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Region a device reports from — in production this is the eero network's
// geo-IP/timezone from Insight (where it's installed), not the shipped-to address.
function countryForSerial(serial: string): { name: string; code: string } {
  return COUNTRY_POOL[hashSeed(serial) % COUNTRY_POOL.length];
}

// ─── Program → device roster drill-in (merged from the old Programs menu) ─────
// This is the "user + DSN per program" table you open from a program card. It's
// the same device list the standalone Programs menu showed, now scoped to one
// program and driven by the Insight identity-match model (email → network →
// beta-model DSN), with in-app resolution for the rows that don't auto-match.
// ── Assigned-device model (the serial↔tester pairing you author in-app) ───────
// A tester can have MANY devices. Each assigned serial is enriched through
// /api/insight?serial= into a network + live status. Until eero auth is live the
// route returns a deterministic seed, so this works today and flips to real data
// with zero UI change.
// Enrich one serial through the /api/insight route (serial-anchored lookup).
// env routes to the right cloud: beta program → prod, dogfood → stage.
async function enrichSerial(serial: string, fallbackModel: string, env: EeroEnv = 'prod'): Promise<AssignedDevice> {
  const clean = serial.trim().toUpperCase();
  try {
    const res = await fetch(`/api/insight?serial=${encodeURIComponent(clean)}&env=${env}`);
    const d = await res.json();
    if (d.match === 'matched' && d.device) {
      return {
        serial: clean,
        model: d.device.model || fallbackModel,
        networkId: d.networkId ?? null,
        status: d.device.online ? 'online' : 'offline',
        firmware: d.device.firmware || '',
        source: d.source === 'live' ? 'live' : 'seed',
      };
    }
    // Insight doesn't know this serial yet → assigned but pending activation.
    return { serial: clean, model: fallbackModel, networkId: null, status: 'pending', firmware: '', source: d.source === 'live' ? 'live' : 'seed' };
  } catch {
    return { serial: clean, model: fallbackModel, networkId: null, status: 'pending', firmware: '', source: 'seed' };
  }
}

// Seed each tester with a deterministic device set so the roster isn't blank in
// the demo. Mirrors /api/insight's seededSerialLookup mix: most testers have one
// matched unit, some have two (multi-device), some are pending, a few have none.
function seedAssignments(program: DemoProgram): Record<string, AssignedDevice[]> {
  const model = betaModelFor(program);
  const map: Record<string, AssignedDevice[]> = {};
  program.testers.forEach((t) => {
    if (t.noSeedDevice) { map[t.id] = []; return; }                   // roster filler — never assign a device
    const seed = hashSeed(t.email);
    const r = seed % 10;
    if (r === 2 || r === 9) { map[t.id] = []; return; }               // not shipped / not assigned yet
    const primary = mkSerial((seed % 900) + 3);
    if (r === 4) {                                                     // assigned but pending activation
      map[t.id] = [{ serial: primary, model, networkId: null, status: 'pending', firmware: '', source: 'seed' }];
      return;
    }
    const networkId = String(17000000 + (seed % 99999));
    const devices: AssignedDevice[] = [
      { serial: primary, model, networkId, status: r === 6 ? 'offline' : 'online', firmware: 'v7.3-beta', source: 'seed' },
    ];
    if (r === 5) {                                                     // multi-device tester (2 units, same mesh)
      devices.push({ serial: mkSerial((seed % 900) + 4), model, networkId, status: 'online', firmware: 'v7.3-beta', source: 'seed' });
    }
    map[t.id] = devices;
  });
  return map;
}

// Map a demo program onto the real deviceStore Program enum — this is the key
// that DevicesTab groups containers by. Seed devices are all 'beta', so a beta
// program's assigned devices must also be 'beta' to land in the same "Merci BETA"
// container the Devices menu shows. Phase (DVT/EVT/PVT) is separate metadata (a
// tag), NOT the container key.
function programEnumFor(program: DemoProgram): Program {
  return program.name.toLowerCase().includes('dogfood') ? 'dogfood' : 'beta';
}

// Shape an assigned device into a full deviceStore Device so it appears in the
// Devices menu (grouped by program) and flows to People (assignedEmail) and
// Locations (country). Deterministic id keeps re-syncs idempotent.
function toStoreDevice(tester: DemoTester, d: AssignedDevice, program: DemoProgram): Device {
  const country = d.networkId ? countryForSerial(d.serial).name : '';
  const now = new Date().toISOString();
  return {
    id: `prog-${program.id}-${d.serial}`,
    serialNumber: d.serial,
    model: 'eero Max 7',
    manufacturer: 'eero',
    revision: '', revisionNotes: '', hardwareConfig: '', mac: '',
    internalName: `${betaModelFor(program)} beta`,
    sku: '', partNumber: '',
    country,
    adminId: '',
    unitId: `UID000${2900000 + (hashSeed(d.serial) % 99999)}`,
    deactivated: false,
    firmwareVersion: d.firmware,
    environment: '',
    status: d.status === 'online' ? 'online' : 'not_online',
    assignedTo: tester.name,
    assignedEmail: tester.email,
    contactEmail: '', alternateEmail: '',
    location: country,
    adminLocation: '',
    network: d.networkId || '',
    program: programEnumFor(program),
    product: betaModelFor(program),
    assetTag: '', poExpensify: '', accountingId: '', cost: '', purchaseDate: '',
    imei1: '', imei2: '', eid: '', tracking: '', jira: '',
    checkedOutTo: tester.name, checkedOutDate: now,
    dueDate: '', notes: '',
    shipmentStatus: 'delivered',
    fcLocation: '', leg1Carrier: '', leg1Tracking: '', leg1Date: '',
    leg2Carrier: '', leg2Tracking: '', leg2Date: '',
    testbedId: '', testbedName: program.name,
    createdAt: now, updatedAt: now,
  };
}

function deviceStatusTag(status: DeviceLiveStatus) {
  if (status === 'online') return <Tag color="green" size="regular">online</Tag>;
  if (status === 'offline') return <Tag color="orange" size="regular">not online</Tag>;
  return <Tag color="grey" size="regular">pending activation</Tag>;
}

// ─── Program → device roster: assign serials, enrich via Insight, link back ────
function ProgramDevicesView({ program, onBack, onToast, onNavigateToPerson }: {
  program: DemoProgram;
  onBack: () => void;
  onToast: (msg: string) => void;
  onNavigateToPerson?: (email: string) => void;
}) {
  const model = betaModelFor(program);
  // Deep-links for this program route to the right cloud (dogfood → stage, else prod).
  const linkEnv = resolveEnv(undefined, programEnumFor(program));
  const { addDevice, updateDevice, deleteDevice, getDeviceBySerial } = useDeviceStore();
  const [roster, setRoster] = useState<DemoTester[]>(() => program.testers);
  const [assignments, setAssignments] = useState<Record<string, AssignedDevice[]>>(() => seedAssignments(program));
  const [serialInput, setSerialInput] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null); // testerId being enriched, or 'sync'
  const [open, setOpen] = useState<{ tester: DemoTester; device: AssignedDevice } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  // Paginate the roster so a program with hundreds of testers pages through
  // instead of one endless scroll — same paginator the Devices menu uses.
  const [page, setPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(10);

  // ── Shared-store bridge ──────────────────────────────────────────────────────
  // Every assigned device is upserted into the real deviceStore (idempotent by
  // serial), so it shows up in Devices/People/Locations. SIMULATION NOTE: in
  // production the write happens once at assignment time; here we also re-sync the
  // seeded roster on open so the demo isn't blank. See the handoff doc.
  const syncToStore = (tester: DemoTester, d: AssignedDevice) => {
    const existing = getDeviceBySerial(d.serial);
    const region = d.networkId ? countryForSerial(d.serial).name : '';
    if (existing) {
      updateDevice(existing.id, {
        status: d.status === 'online' ? 'online' : 'not_online',
        network: d.networkId || '',
        firmwareVersion: d.firmware,
        assignedTo: tester.name,
        assignedEmail: tester.email,
        program: programEnumFor(program),
        product: betaModelFor(program),
        country: region || existing.country,
        location: region || existing.location,
      });
    } else {
      addDevice(toStoreDevice(tester, d, program));
    }
  };
  const removeFromStore = (serial: string) => {
    const existing = getDeviceBySerial(serial);
    if (existing) deleteDevice(existing.id);
  };

  // Sync the seeded roster into the store once when the program opens.
  useEffect(() => {
    if (program.type === 'feature') return;
    roster.forEach((t) => (assignments[t.id] || []).forEach((d) => syncToStore(t, d)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDevices = roster.flatMap((t) => assignments[t.id] || []);
  const total = allDevices.length;
  const onlineCount = allDevices.filter((d) => d.status === 'online').length;
  const pendingCount = allDevices.filter((d) => d.status === 'pending').length;
  const testersWithDevice = roster.filter((t) => (assignments[t.id] || []).length > 0).length;
  const unassigned = roster.length - testersWithDevice;

  const enrichAll = async (devs: AssignedDevice[]) => Promise.all(devs.map((d) => enrichSerial(d.serial, model, linkEnv)));

  const assignSerial = async (tester: DemoTester) => {
    const raw = (serialInput[tester.id] || '').trim();
    if (!raw) return;
    const serials = raw.split(/[\s,]+/).filter(Boolean);
    const existing = new Set((assignments[tester.id] || []).map((d) => d.serial));
    setBusy(tester.id);
    const enriched = await enrichAll(serials.map((s) => ({ serial: s } as AssignedDevice)));
    const toAdd = enriched.filter((d) => !existing.has(d.serial));
    setAssignments((prev) => ({ ...prev, [tester.id]: [...(prev[tester.id] || []), ...toAdd] }));
    toAdd.forEach((d) => syncToStore(tester, d));
    setSerialInput((prev) => ({ ...prev, [tester.id]: '' }));
    setBusy(null);
    onToast(toAdd.length ? `Assigned ${toAdd.length} device${toAdd.length !== 1 ? 's' : ''} to ${tester.name} — now in the Devices menu too` : 'Those serials are already assigned');
  };

  const recheckTester = async (tester: DemoTester) => {
    const devs = assignments[tester.id] || [];
    if (!devs.length) return;
    setBusy(tester.id);
    const next = await enrichAll(devs);
    setAssignments((prev) => ({ ...prev, [tester.id]: next }));
    next.forEach((d) => syncToStore(tester, d));
    setBusy(null);
    onToast(`Refreshed ${tester.name}'s device${devs.length > 1 ? 's' : ''} info from Insight`);
  };

  const syncAll = async () => {
    setBusy('sync');
    const entries = await Promise.all(roster.map(async (t) => [t.id, await enrichAll(assignments[t.id] || [])] as const));
    setAssignments(Object.fromEntries(entries));
    entries.forEach(([tid, devs]) => { const t = roster.find((x) => x.id === tid); if (t) devs.forEach((d) => syncToStore(t, d)); });
    setBusy(null);
    onToast('Synced all assigned devices from Insight');
  };

  const removeDevice = (tester: DemoTester, serial: string) => {
    setAssignments((prev) => ({ ...prev, [tester.id]: (prev[tester.id] || []).filter((d) => d.serial !== serial) }));
    removeFromStore(serial);
    onToast(`Unassigned ${serial} from ${tester.name} — also removed from the Devices menu`);
  };

  const removeTester = (tester: DemoTester) => {
    (assignments[tester.id] || []).forEach((d) => removeFromStore(d.serial));
    setRoster((prev) => prev.filter((t) => t.id !== tester.id));
    setAssignments((prev) => { const n = { ...prev }; delete n[tester.id]; return n; });
    onToast(`Removed ${tester.name} from program`);
  };

  const addTester = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const t: DemoTester = {
      id: `${program.id}-new-${roster.length}-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      programName: program.name,
      technicalLevel: 'Intermediate',
      reliability: 0,
      avgResponseDays: 0,
      feedbackQuality: 0,
      deviceOnline: null,
      missedSurveys: 0,
    };
    setRoster((prev) => [t, ...prev]);
    setAssignments((prev) => ({ ...prev, [t.id]: [] }));
    onToast(`Added ${t.name} — assign their serial(s) below`);
    setNewName(''); setNewEmail(''); setAddOpen(false);
  };

  if (open) {
    // Reuse the real, fully-editable DeviceDetailPanel (same one used in the
    // Devices / People / Search menus). The device was synced into the store on
    // click, so edits persist to the shared record; fall back to a synthesized
    // Device if it's somehow not present yet.
    const stored = getDeviceBySerial(open.device.serial) || toStoreDevice(open.tester, open.device, program);
    return (
      <DeviceDetailPanel
        device={stored}
        onClose={() => setOpen(null)}
        onNavigateToPerson={onNavigateToPerson}
      />
    );
  }

  // Roster pagination (feature programs have no roster list, so this is inert there).
  const rosterTotalPages = Math.max(1, Math.ceil(roster.length / rosterPageSize));
  const rosterPage = Math.min(page, rosterTotalPages);
  const rosterStart = (rosterPage - 1) * rosterPageSize;
  const rosterPageItems = roster.slice(rosterStart, rosterStart + rosterPageSize);

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
          <Button type="default" leftIcon={ICONS.FUNCTIONAL_REFRESH} label={busy === 'sync' ? 'Syncing…' : 'Sync from Insight'} onClick={syncAll} />
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
            Roster comes from the <b style={{ color: TEXT_PRIMARY }}>Qualtrics audience</b>. Assign each tester the <b style={{ color: TEXT_PRIMARY }}>serial(s)</b> you shipped them — Insight resolves each to its <b style={{ color: TEXT_PRIMARY }}>network + live status</b> and links back to the platform. A tester can have more than one unit — assign each serial you shipped them.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tag color="green" size="regular">{onlineCount}/{total} online</Tag>
            {pendingCount > 0 && <Tag color="orange" size="regular">{pendingCount} pending activation</Tag>}
            {unassigned > 0 && <Tag color="grey" size="regular">{unassigned} unassigned</Tag>}
            <span className="text-xs" style={{ color: TEXT_TERTIARY }}>· {total} device{total !== 1 ? 's' : ''} across {roster.length} tester{roster.length !== 1 ? 's' : ''}</span>
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

          <div className="flex flex-col gap-3">
            {rosterPageItems.map((t) => {
              const devs = assignments[t.id] || [];
              const isBusy = busy === t.id;
              return (
                <Card key={t.id} size={2}>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        {onNavigateToPerson && devs.length > 0 ? (
                          <button
                            className="block max-w-full truncate text-left text-sm font-medium hover:underline"
                            style={{ color: ACCENT }}
                            onClick={() => onNavigateToPerson(t.email)}
                            title="Open this tester in People"
                          >
                            {t.name}
                          </button>
                        ) : (
                          <p className="truncate text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{t.name}</p>
                        )}
                        <p className="truncate text-xs" style={{ color: TEXT_TERTIARY }}>{t.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {devs.length > 0 && <Button type="text" leftIcon={ICONS.FUNCTIONAL_REFRESH} label={isBusy ? 'Refreshing…' : 'Refresh info'} onClick={() => recheckTester(t)} />}
                        <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} ariaLabel="Remove tester" onClick={() => removeTester(t)} />
                      </div>
                    </div>

                    {devs.length > 0 ? (
                      <div className="flex flex-col divide-y" style={{ borderColor: TRACK }}>
                        {devs.map((d) => (
                          <div key={d.serial} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                            <button className="font-mono text-sm hover:underline" style={{ color: ACCENT }} onClick={() => { syncToStore(t, d); setOpen({ tester: t, device: d }); }}>{d.serial}</button>
                            <Tag color="grey" size="regular">{d.model}</Tag>
                            {deviceStatusTag(d.status)}
                            {d.networkId
                              ? <span className="text-xs" style={{ color: TEXT_SECONDARY }}>📍 {countryForSerial(d.serial).name}</span>
                              : <span className="text-xs" style={{ color: TEXT_TERTIARY }}>awaiting first connection</span>}
                            {d.networkId && (() => {
                              const nurl = insightNetworkUrl(d.networkId!, linkEnv);
                              const aurl = adminNetworkUrl(d.networkId!, linkEnv);
                              return (nurl || aurl) ? (
                                <span className="flex items-center gap-2 text-xs">
                                  {nurl && <a href={nurl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: ACCENT }}>Insight network ↗</a>}
                                  {nurl && aurl && <span style={{ color: TEXT_TERTIARY }}>·</span>}
                                  {aurl && <a href={aurl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: ACCENT }}>Admin ↗</a>}
                                </span>
                              ) : (
                                <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{linkEnv} links not configured</span>
                              );
                            })()}
                            <div className="ml-auto flex items-center gap-2">
                              <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} ariaLabel={`Unassign ${d.serial}`} onClick={() => removeDevice(t, d.serial)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: TEXT_TERTIARY }}>No devices assigned yet.</p>
                    )}

                    <div className="flex flex-wrap items-end gap-2">
                      <div className="w-72">
                        <Input
                          id={`assign-${t.id}`}
                          label="Assign serial(s)"
                          value={serialInput[t.id] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSerialInput((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder="GGC54MX36114… (comma-separate for several)"
                          layout="vertical"
                        />
                      </div>
                      <Button type="default" label={isBusy ? 'Resolving…' : 'Assign'} onClick={() => assignSerial(t)} />
                    </div>
                  </div>
                </Card>
              );
            })}
            {roster.length === 0 && (
              <Card size={4}><p className="text-sm" style={{ color: TEXT_TERTIARY }}>No testers on this program yet. Add one above or import a Qualtrics audience.</p></Card>
            )}
          </div>

          {roster.length > 10 && (
            <Pagination
              pagination={{ totalItems: roster.length, totalPages: rosterTotalPages, hasPreviousPage: rosterPage > 1, hasNextPage: rosterPage < rosterTotalPages }}
              currentPage={rosterPage}
              pageSize={rosterPageSize}
              onPageChange={setPage}
              onNextPage={() => setPage((n) => Math.min(rosterTotalPages, n + 1))}
              onPreviousPage={() => setPage((n) => Math.max(1, n - 1))}
              onPageSizeChange={(s) => { setRosterPageSize(s); setPage(1); }}
              pageSizeOptions={[{ value: 10, label: '10' }, { value: 25, label: '25' }, { value: 50, label: '50' }]}
              ln10_label={{ prevBtn: 'Previous', nextBtn: 'Next', pageBtn: 'Page', itemsPerPage: 'Per page', counter: (s, e, t) => `Showing ${s}–${e} of ${t}` }}
            />
          )}
        </>
      )}
    </div>
  );
}

// Compact metric cell — small muted label over a small value, Insight row style.
function HealthMetric({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div className="min-w-0 leading-snug">
      <p className="truncate text-xs font-semibold" style={{ color: TEXT_PRIMARY }}>{label}</p>
      {onClick
        ? <button className="mt-1 block max-w-full truncate text-left text-sm hover:underline" style={{ color: ACCENT }} onClick={onClick}>{children}</button>
        : <div className="mt-1 truncate text-sm" style={{ color: TEXT_SECONDARY }}>{children}</div>}
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
  // Device counts are derived from the SHARED deviceStore (the same source the
  // Devices menu's containers + Overview boxes use), so every menu shows matching
  // numbers. As devices are assigned/brought online, these update automatically.
  const { devices } = useDeviceStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.max(1, Math.ceil(programs.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = programs.slice(start, start + pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium" style={{ color: TEXT_SECONDARY }}>{programs.length} program{programs.length === 1 ? '' : 's'}</p>
        <div className="flex items-center gap-2">
          <Button type="primary" leftIcon={ICONS.FUNCTIONAL_ADD} label="New Program" onClick={onNewProgram} />
          <Button type="text" leftIcon={ICONS.FUNCTIONAL_DOWNLOAD} label="Export report" onClick={() => onToast('Exported program-health report to CSV (simulated)')} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {pageItems.map((p) => {
          const surveyCount = surveys.filter((s) => s.programId === p.id).length;
          const noSurveys = p.status === 'active' && surveyCount === 0;
          // Match the DevicesTab container exactly: all devices grouped under this
          // program's enum key. Online = those reporting online right now.
          const progDevices = p.type === 'feature' ? [] : devices.filter((d) => d.program === programEnumFor(p));
          const deployed = progDevices.length;
          const online = progDevices.filter((d) => d.status === 'online').length;
          // This program's devices in the archive lifecycle (linked by name), for the
          // closed-program record shown on completed cards.
          const archivedForProgram = p.type === 'feature' ? [] : devices.filter((d) => d.testbedName === p.name && (d.status === 'pending_return' || (d.status === 'deactivated' && d.archivedAt)));
          return (
            <Card key={p.id} size={3}>
              <div className="flex flex-col gap-4">
                {/* One row: name + subtitle · metric columns (label bold, value grey) · status.
                    items-start keeps every label on one line and every value on the line below. */}
                <div className="flex items-start gap-x-4 py-1">
                  <div className="min-w-0 flex-[2] leading-tight">
                    {p.type === 'hardware'
                      ? <button className="block max-w-full truncate text-left text-sm font-medium hover:underline" style={{ color: ACCENT }} onClick={() => onOpenDevices(p)}>{p.name}</button>
                      : <span className="block max-w-full truncate text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{p.name}</span>}
                    <p className="mt-0.5 truncate text-xs" style={{ color: TEXT_TERTIARY }}>{p.type === 'feature' ? 'Feature' : `Hardware${p.currentPhase ? ` · ${p.currentPhase}` : ''}`}</p>
                  </div>
                  <div className="flex-1"><HealthMetric label="Audience">{p.audienceSize} testers</HealthMetric></div>
                  <div className="flex-1"><HealthMetric label="Response rate">{p.surveyResponseRate}%</HealthMetric></div>
                  <div className="flex-1">
                    <HealthMetric label="Devices online" onClick={p.type === 'hardware' ? () => onOpenDevices(p) : undefined}>
                      {p.type === 'feature' ? '—' : `${online} of ${deployed}`}
                    </HealthMetric>
                  </div>
                  <div className="flex-1"><HealthMetric label="Feedback">{p.avgFeedbackQuality > 0 ? `${p.avgFeedbackQuality.toFixed(1)} / 5` : '—'}</HealthMetric></div>
                  <div className="flex flex-1 justify-end">
                    {p.status === 'completed'
                      ? <Tag color="periwinkle" size="regular">Completed</Tag>
                      : <Tag color="green" size="regular">In progress</Tag>}
                  </div>
                </div>

                {p.status === 'completed' && p.type === 'hardware' && (
                  <div className="rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: 'var(--ui-background-layer-layer-page-hover)', color: TEXT_SECONDARY }}>
                    Closed{p.closedAt ? ` ${new Date(p.closedAt).toLocaleDateString()}` : ''} · <b style={{ color: TEXT_PRIMARY }}>{archivedForProgram.length}</b> device{archivedForProgram.length !== 1 ? 's' : ''} archived — track returns in <b style={{ color: TEXT_PRIMARY }}>Device Ingestion &amp; Returns → Archived</b>.
                  </div>
                )}

                {noSurveys && (
                  <div className="rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: 'var(--ui-core-ocean-blue-ocean-1)', color: TEXT_SECONDARY }}>
                    No surveys yet — add your first with <b style={{ color: TEXT_PRIMARY }}>New survey</b>.
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {p.type === 'hardware' && <Button type="text" label="View devices" onClick={() => onOpenDevices(p)} />}
                    {p.status === 'active' && <Button type="text" leftIcon={ICONS.FUNCTIONAL_ADD} label="New survey" onClick={() => onNewSurvey(p.id)} />}
                    <Button type="text" leftIcon={p.status === 'active' ? ICONS.FUNCTIONAL_CHECK : ICONS.FUNCTIONAL_REFRESH} label={p.status === 'active' ? 'Close' : 'Reopen'} onClick={() => onToggleStatus(p)} />
                  </div>
                  <Button type="text" leftIcon={ICONS.FUNCTIONAL_DELETE} label="Delete" onClick={() => onDeleteProgram(p)} />
                </div>
              </div>
            </Card>
          );
        })}

        {programs.length === 0 && (
          <Card size={4}><p className="text-sm" style={{ color: TEXT_TERTIARY }}>No programs yet. Create one with <b style={{ color: TEXT_PRIMARY }}>New Program</b>.</p></Card>
        )}
      </div>

      {programs.length > 0 && (
        <Pagination
          pagination={{ totalItems: programs.length, totalPages, hasPreviousPage: current > 1, hasNextPage: current < totalPages }}
          currentPage={current}
          pageSize={pageSize}
          onPageChange={setPage}
          onNextPage={() => setPage((n) => Math.min(totalPages, n + 1))}
          onPreviousPage={() => setPage((n) => Math.max(1, n - 1))}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          pageSizeOptions={[{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 25, label: '25' }]}
          ln10_label={{ prevBtn: 'Previous', nextBtn: 'Next', pageBtn: 'Page', itemsPerPage: 'Per page', counter: (s, e, t) => `Showing ${s}–${e} of ${t}` }}
        />
      )}
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

// ─── Programs feature root ───────────────────────────────────────────────────
// Renders the Programs / Surveys / Engagement / Program Health tabs. Callers wrap
// this in an EDS <ToastProvider> (the in-app tab and the /programs route both do).
export function ProgramsView({ embedded = false, onNavigateToPerson }: { embedded?: boolean; onNavigateToPerson?: (email: string) => void } = {}) {
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
  const { devices, updateDevice } = useDeviceStore();
  const { cohort } = useUiStore();

  // Cohort lens: dogfood → dogfood programs, beta → everything else. Applied to the
  // displayed lists; full `programs`/`surveys` stay intact for create/delete + pickers.
  const visiblePrograms = useMemo(
    () => (cohort === 'all' ? programs : programs.filter((p) => programEnumFor(p) === cohort)),
    [programs, cohort],
  );
  const visibleProgramIds = useMemo(() => new Set(visiblePrograms.map((p) => p.id)), [visiblePrograms]);
  const visibleSurveys = useMemo(
    () => (cohort === 'all' ? surveys : surveys.filter((s) => visibleProgramIds.has(s.programId))),
    [surveys, cohort, visibleProgramIds],
  );

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
    if (program.status === 'active') {
      // Closing: push this program's still-active devices to Archived so each
      // return can be tracked individually (Device Ingestion & Returns → Archived).
      const progDevices = devices.filter((d) => d.testbedName === program.name && d.status !== 'deactivated' && d.status !== 'pending_return');
      const ok = window.confirm(
        `Close “${program.name}”?\n\n${progDevices.length} device(s) will be moved to Archived. Track each device's return individually there and mark it Archived once handled.`
      );
      if (!ok) return;
      const now = new Date().toISOString();
      progDevices.forEach((d) => updateDevice(d.id, { status: 'pending_return', returnEmailSentAt: d.returnEmailSentAt || now, programClosedAt: now }));
      setPrograms((prev) => prev.map((p) => (p.id === program.id ? { ...p, status: 'completed', closedAt: now } : p)));
      showToast(`Closed ${program.name} — ${progDevices.length} device${progDevices.length !== 1 ? 's' : ''} moved to Archived`);
    } else {
      setPrograms((prev) => prev.map((p) => (p.id === program.id ? { ...p, status: 'active' } : p)));
      showToast(`Reopened ${program.name}`);
    }
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
    <div className={embedded ? '' : 'min-h-screen'} style={embedded ? undefined : { backgroundColor: 'var(--ui-background-bg-secondary, #f5f6f7)' }}>
      <div className={`w-full ${embedded ? 'px-0 pt-0 pb-10' : 'px-6 pt-6 pb-10'}`}>
        <header className="mb-3">
          <h1 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>Surveys &amp; Engagement</h1>
          <p className="mt-0.5 text-xs" style={{ color: TEXT_TERTIARY }}>
            Feedback loop for beta &amp; dogfood programs — surveys via Qualtrics, joined to your testers, programs, and devices.
          </p>
        </header>

        <div className="mb-4 w-fit">
          <Segmented
            value={view}
            onChange={(v) => { setView(v); setSelected(null); setOpenProgram(null); }}
            items={TABS.map((t) => ({ label: t.label, value: t.value }))}
          />
        </div>

        {view === 'surveys' && (selected
          ? (selected.status === 'draft'
              ? <DraftPanel survey={selected} onBack={() => setSelected(null)} onDelete={() => handleDeleteSurvey(selected)} />
              : <SurveyResults survey={selected} onBack={() => setSelected(null)} onToast={showToast} onDelete={() => handleDeleteSurvey(selected)} />)
          : <SurveyList surveys={visibleSurveys} onSelect={setSelected} onNewSurvey={() => setNewSurvey({ open: true })} onDelete={handleDeleteSurvey} />)}
        {view === 'engagement' && <EngagementView programs={visiblePrograms} onToast={showToast} />}
        {view === 'health' && (openProgram
          ? <ProgramDevicesView program={openProgram} onBack={() => setOpenProgram(null)} onToast={showToast} onNavigateToPerson={onNavigateToPerson} />
          : <ProgramHealthView
              programs={visiblePrograms}
              surveys={visibleSurveys}
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
    // Keep the REAL Qualtrics contacts as this program's tester roster (identity
    // real; engagement metrics simulated). This is what feeds the Engagement view.
    const testers = (audience?.contacts ?? []).map((c) => contactToTester(c, { id, name: name.trim(), type }));
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
      testers,
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
