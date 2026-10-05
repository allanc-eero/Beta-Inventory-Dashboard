'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Select, Tag, Card, Modal, Checkbox, Divider, ICONS } from '@amzn/eero-web-design-components';
import { ChevronLeft, Sparkles, AlertTriangle, CheckCircle2, Wrench, Link2, MessageSquare } from 'lucide-react';
import {
  DemoProgram, BoundSurvey, MilestoneType, Phase, MILESTONE_LABEL, PHASES,
  LiveSurveyListItem, LiveReport,
} from './types';
import { DEMO_PROGRAMS } from './mockData';
import { generateNarrative, AI_DISCLAIMER, AiNarrative } from './aiNarrative';
// Reuse the Programs feature's token constants so the demo matches the live
// design system exactly (inline-style tokens, never arbitrary Tailwind).
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TRACK, OK_GREEN, BAD_RED, ACCENT } from '../programs/theme';

// Demo-local EDS tokens the shared theme doesn't export.
const PLACEHOLDER = 'var(--ui-text-text-placeholder)';
const SUCCESS_TEXT = 'var(--ui-support-text-support-success)';
const WARN_FILL = 'var(--ui-support-fill-support-warning)';
const WARN_BORDER = 'var(--ui-support-border-support-warning)';
const WARN_TEXT = 'var(--ui-support-text-icon-support-warning)';
const INFO_FILL = 'var(--ui-support-fill-support-info)';
const AI_BORDER = 'var(--ui-core-periwinkle-periwinkle-3)';
const PAGE_BG = 'var(--ui-background-layer-background-page)';
const SUBTLE_FILL = 'var(--ui-background-layer-layer-page-hover)';

const MILESTONE_OPTIONS = (Object.keys(MILESTONE_LABEL) as MilestoneType[]).map((m) => ({ value: m, label: MILESTONE_LABEL[m] }));
const PHASE_OPTIONS = PHASES.map((p) => ({ value: p, label: p }));
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

// Live Qualtrics survey → report flow. Rendered as the "Surveys" view inside the
// Surveys & Engagement section (ProgramsView), and standalone-capable.
// `embedded` drops the full-page shell since the host provides page chrome.
export default function SurveysEngagementReport({ embedded = false }: { embedded?: boolean } = {}) {
  const [programs, setPrograms] = useState<DemoProgram[]>(DEMO_PROGRAMS);
  const [programId, setProgramId] = useState<string | null>(null);
  const [surveyLocalId, setSurveyLocalId] = useState<string | null>(null);

  const program = programs.find((p) => p.id === programId) || null;
  const survey = program?.surveys.find((s) => s.localId === surveyLocalId) || null;

  const saveSurvey = (pid: string, next: BoundSurvey) =>
    setPrograms((ps) => ps.map((p) => {
      if (p.id !== pid) return p;
      const exists = p.surveys.some((s) => s.localId === next.localId);
      return { ...p, surveys: exists ? p.surveys.map((s) => (s.localId === next.localId ? next : s)) : [...p.surveys, next] };
    }));

  const content = survey && program ? (
    <SurveyReportScreen program={program} survey={survey} onBack={() => setSurveyLocalId(null)} />
  ) : program ? (
    <ProgramScreen program={program} onBack={() => setProgramId(null)} onOpenSurvey={setSurveyLocalId}
      onSaveSurvey={(s) => saveSurvey(program.id, s)} />
  ) : (
    <ProgramsScreen programs={programs} onOpen={setProgramId} />
  );

  // Embedded: host (ProgramsView) already supplies the page background, header
  // and padding — just render the flow.
  if (embedded) return content;

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div className="mx-auto px-6 py-8" style={{ maxWidth: 1120 }}>{content}</div>
    </div>
  );
}

// ─── Screen 1: programs ───────────────────────────────────────────────────────
// Row layout mirrors the Program Health view: blue name link · label/value metric
// columns · status tag on the right.
function ProgramsScreen({ programs, onOpen }: { programs: DemoProgram[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium" style={{ color: TEXT_SECONDARY }}>{programs.length} program{programs.length === 1 ? '' : 's'}</p>
      <div className="flex flex-col gap-3">
        {programs.map((p) => {
          const phases = Array.from(new Set(p.surveys.map((s) => s.phase)));
          return (
            <Card key={p.id} size={3}>
              <div className="flex items-start gap-x-4 py-1">
                <div className="min-w-0 flex-[2] leading-tight">
                  <button className="block max-w-full truncate text-left text-sm font-medium hover:underline" style={{ color: ACCENT }} onClick={() => onOpen(p.id)}>{p.name}</button>
                  <p className="mt-0.5 truncate text-xs" style={{ color: TEXT_TERTIARY }}>Beta program</p>
                </div>
                <div className="flex-1"><Metric label="Surveys">{p.surveys.length}</Metric></div>
                <div className="flex-1"><Metric label="Phases">{phases.join(', ') || '—'}</Metric></div>
                <div className="flex flex-1 justify-end"><Tag color="green" size="regular">Active</Tag></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Screen 2: a program's surveys ────────────────────────────────────────────
function ProgramScreen({ program, onBack, onOpenSurvey, onSaveSurvey }: {
  program: DemoProgram; onBack: () => void; onOpenSurvey: (id: string) => void; onSaveSurvey: (s: BoundSurvey) => void;
}) {
  const [editing, setEditing] = useState<BoundSurvey | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <BackLink label="Programs" onClick={onBack} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="leading-tight">
          <h2 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>{program.name}</h2>
          <p className="mt-0.5 text-xs" style={{ color: TEXT_TERTIARY }}>{program.surveys.length} survey{program.surveys.length === 1 ? '' : 's'}</p>
        </div>
        <Button type="primary" leftIcon={ICONS.FUNCTIONAL_ADD} label="Add survey" onClick={() => setAdding(true)} />
      </div>

      <div className="flex flex-col gap-3">
        {program.surveys.map((s) => {
          const bound = Boolean(s.qualtricsId);
          return (
            <Card key={s.localId} size={3}>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-x-4 py-1">
                  <div className="min-w-0 flex-[2] leading-tight">
                    {bound
                      ? <button className="block max-w-full truncate text-left text-sm font-medium hover:underline" style={{ color: ACCENT }} onClick={() => onOpenSurvey(s.localId)}>{s.name}</button>
                      : <span className="block max-w-full truncate text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{s.name}</span>}
                    <p className="mt-0.5 truncate text-xs" style={{ color: TEXT_TERTIARY }}>{bound ? s.qualtricsId : 'not linked to Qualtrics'}</p>
                  </div>
                  <div className="flex-1"><Metric label="Milestone">{MILESTONE_LABEL[s.milestone]}</Metric></div>
                  <div className="flex-1"><Metric label="Phase">{s.phase}</Metric></div>
                  <div className="flex flex-1 justify-end">
                    {bound ? <Tag color="green" size="regular">Linked</Tag> : <Tag color="periwinkle" size="regular">Unbound</Tag>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {bound
                    ? <Button type="text" label="Open report" onClick={() => onOpenSurvey(s.localId)} />
                    : <Button type="text" label="Bind" onClick={() => setEditing(s)} />}
                  <Button type="text" label="Edit" onClick={() => setEditing(s)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {(adding || editing) && (
        <SurveyBindModal survey={editing} onClose={() => { setAdding(false); setEditing(null); }}
          onSave={(s) => { onSaveSurvey(s); setAdding(false); setEditing(null); }} />
      )}
    </div>
  );
}

// ─── Add / Edit survey (bind to a REAL Qualtrics survey) ──────────────────────
function SurveyBindModal({ survey, onClose, onSave }: {
  survey: BoundSurvey | null; onClose: () => void; onSave: (s: BoundSurvey) => void;
}) {
  const [qualtricsId, setQualtricsId] = useState<string>(survey?.qualtricsId || '');
  const [milestone, setMilestone] = useState<MilestoneType>(survey?.milestone || 'oobe');
  const [phase, setPhase] = useState<Phase>(survey?.phase || 'Beta');
  const [notInQualtrics, setNotInQualtrics] = useState<boolean>(survey ? !survey.qualtricsId : false);
  const [surveys, setSurveys] = useState<LiveSurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'seed'>('live');

  useEffect(() => {
    let on = true;
    fetch('/api/survey-report?action=list')
      .then((r) => r.json())
      .then((d) => { if (!on) return; setSurveys(d.surveys || []); setSource(d.source || 'live'); })
      .catch(() => on && setSurveys([]))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, []);

  const chosen = surveys.find((s) => s.id === qualtricsId) || null;

  const save = () => {
    const name = notInQualtrics ? (survey?.name || 'New survey (awaiting Qualtrics)') : (chosen?.name || survey?.name || 'Survey');
    onSave({
      localId: survey?.localId || `sv-${Date.now()}`,
      qualtricsId: notInQualtrics ? null : (qualtricsId || null),
      name, milestone, phase,
    });
  };

  return (
    <Modal isOpen title={survey ? 'Edit survey' : 'Add survey'} onCancel={onClose} onOk={save}
      okText={survey && !survey.qualtricsId ? 'Bind survey' : 'Save'} cancelText="Cancel">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: TEXT_SECONDARY }}>Qualtrics survey</label>
          <Select id="bind-qualtrics" value={notInQualtrics ? '' : qualtricsId}
            onChange={(v: string) => { setQualtricsId(v); setNotInQualtrics(false); }}
            options={[{ value: '', label: loading ? 'Loading surveys from Qualtrics…' : 'Select a survey from Qualtrics…' },
              ...surveys.map((s) => ({ value: s.id, label: s.name }))]} />
          {chosen && !notInQualtrics && (
            <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: SUCCESS_TEXT }}>
              <CheckCircle2 size={12} /> Linked to {chosen.id}
            </p>
          )}
          {source === 'seed' && !loading && (
            <p className="mt-1 text-xs" style={{ color: WARN_TEXT }}>Showing a sample list — live Qualtrics list unavailable.</p>
          )}
          <div className="mt-2">
            <Checkbox checked={notInQualtrics}
              onChange={(e: { target: { checked: boolean } }) => setNotInQualtrics(e.target.checked)}
              label="Not created in Qualtrics yet — bind later" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: TEXT_SECONDARY }}>Milestone type</label>
            <Select id="bind-milestone" value={milestone} onChange={(v: MilestoneType) => setMilestone(v)} options={MILESTONE_OPTIONS} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: TEXT_SECONDARY }}>Phase</label>
            <Select id="bind-phase" value={phase} onChange={(v: Phase) => setPhase(v)} options={PHASE_OPTIONS} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Screen 3: survey report ──────────────────────────────────────────────────
function SurveyReportScreen({ program, survey, onBack }: {
  program: DemoProgram; survey: BoundSurvey; onBack: () => void;
}) {
  const [from, setFrom] = useState<string>(daysAgo(30));
  const [to, setTo] = useState<string>(today());
  const [report, setReport] = useState<LiveReport | null>(null);
  const [narrative, setNarrative] = useState<AiNarrative | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = (days: number) => { setFrom(daysAgo(days)); setTo(today()); };

  const generate = async () => {
    if (!survey.qualtricsId) return;
    setGenerating(true); setError(null); setReport(null); setNarrative(null);
    try {
      const res = await fetch(`/api/survey-report?action=report&surveyId=${encodeURIComponent(survey.qualtricsId)}&from=${from}&to=${to}`);
      if (!res.ok) throw new Error(`Report request failed (${res.status})`);
      const data: LiveReport = await res.json();
      setReport(data);
      setNarrative(generateNarrative(data));
    } catch (e: any) {
      setError(e.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackLink label={program.name} onClick={onBack} />

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>{survey.name}</h2>
          <Tag color="navy" size="regular">{MILESTONE_LABEL[survey.milestone]}</Tag>
          <Tag color="ocean" size="regular">{survey.phase}</Tag>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: TEXT_TERTIARY }}>
          <Link2 size={13} /> {survey.qualtricsId}
        </p>
      </div>

      {/* Date range + generate */}
      <Card size={3}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40"><Input id="r-from" type="date" label="From" value={from} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)} layout="vertical" /></div>
          <div className="w-40"><Input id="r-to" type="date" label="To" value={to} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)} layout="vertical" /></div>
          <div className="flex items-center gap-1">
            {[7, 14, 30, 90].map((d) => <Button key={d} type="text" onClick={() => preset(d)} label={`${d}d`} />)}
          </div>
          <div className="flex-1" />
          <Button type="primary" onClick={generate} loading={generating} ariaLabel="Generate report"
            label={<span className="flex items-center gap-2"><Sparkles size={16} /> Generate report</span>} />
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border p-4" style={{ backgroundColor: WARN_FILL, borderColor: WARN_BORDER }}>
          <p className="text-sm" style={{ color: WARN_TEXT }}>{error}</p>
        </div>
      )}

      {generating && <p className="py-8 text-center text-sm" style={{ color: PLACEHOLDER }}>Pulling responses from Qualtrics…</p>}

      {/* No responses in the chosen window — clean empty state, not hollow panels. */}
      {report && !generating && report.responders === 0 && (
        <Card size={3}>
          <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>No responses in this date range.</p>
          <p className="mt-1 text-sm" style={{ color: TEXT_TERTIARY }}>Try a wider window or one of the presets above — this survey has no submissions between {report.from} and {report.to}.</p>
        </Card>
      )}

      {/* AI summary first, then the deterministic report beneath it. */}
      {report && !generating && report.responders > 0 && <AiPanel narrative={narrative} report={report} />}
      {report && !generating && report.responders > 0 && <FactualReport report={report} />}
      {!report && !generating && !error && (
        <p className="py-8 text-center text-sm" style={{ color: PLACEHOLDER }}>Choose a date range and generate a report.</p>
      )}
    </div>
  );
}

// ─── AI narrative panel (with disclaimer) — shown first ───────────────────────
function AiPanel({ narrative, report }: { narrative: AiNarrative | null; report: LiveReport }) {
  return (
    <div className="rounded-lg border p-5" style={{ borderColor: AI_BORDER, backgroundColor: INFO_FILL }}>
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Sparkles size={16} color={ACCENT} /> AI summary</h3>
      <p className="mb-4 flex items-start gap-1 text-xs" style={{ color: TEXT_TERTIARY }}><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {AI_DISCLAIMER}</p>
      {report.source === 'seed' && report.notice && (
        <p className="mb-3 text-xs" style={{ color: WARN_TEXT }}>⚠ {report.notice}</p>
      )}

      {!narrative ? (
        <p className="text-sm" style={{ color: TEXT_TERTIARY }}>Analyzing responses…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: TEXT_SECONDARY }}>{narrative.summary}</p>
          <NarrativeList icon={<AlertTriangle size={14} color={BAD_RED} />} title="Risks" items={narrative.risks} />
          <NarrativeList icon={<CheckCircle2 size={14} color={OK_GREEN} />} title="Going well" items={narrative.goingWell} />
          <NarrativeList icon={<Wrench size={14} color={ACCENT} />} title="Recommended actions" items={narrative.actions} />
        </div>
      )}
    </div>
  );
}

function NarrativeList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_TERTIARY }}>{icon} {title}</p>
      <ul className="space-y-1">
        {items.map((it, i) => <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXT_SECONDARY }}><span className="mt-1.5 size-1 shrink-0 rounded-full" style={{ backgroundColor: PLACEHOLDER }} /> {it}</li>)}
      </ul>
    </div>
  );
}

// ─── Factual (deterministic) report ───────────────────────────────────────────
function FactualReport({ report }: { report: LiveReport }) {
  const { scaleQuestions, choiceQuestions, textQuestions, flaggedResponders, platformBreakdown } = report;
  const tile = (label: string, value: string, tone?: 'good' | 'bad') => (
    <Card size={3}>
      <p className="text-xs uppercase tracking-wide" style={{ color: TEXT_TERTIARY }}>{label}</p>
      <p className="mt-1 text-3xl font-bold" style={{ color: tone === 'bad' ? BAD_RED : tone === 'good' ? OK_GREEN : TEXT_PRIMARY }}>{value}</p>
    </Card>
  );

  return (
    <div className="space-y-5">
      <Divider />
      <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: TEXT_TERTIARY }}>
        Report · {report.from} → {report.to} {report.source === 'live' ? '· live Qualtrics' : '· sample data'}
      </h2>

      {/* At a glance — adapts to whatever the survey contains. Overall/Flagged
          only appear when there are rated questions to compute them from. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tile('Responses analyzed', `${report.responders}`)}
        {tile('Questions summarized', `${scaleQuestions.length + choiceQuestions.length + textQuestions.length}`)}
        {report.overallAvg5 !== null && tile('Overall', `${report.overallAvg5}`, report.overallAvg5 >= 4 ? 'good' : report.overallAvg5 <= 3 ? 'bad' : undefined)}
        {scaleQuestions.length > 0 && tile('Flagged (≤3)', `${report.flaggedCount}`, report.flaggedCount > 0 ? 'bad' : 'good')}
      </div>

      {/* Rated questions */}
      {scaleQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Rated questions</h3>
          {scaleQuestions.map((q) => (
            <Card key={q.id} size={3}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{q.prompt}</p>
                <span className="shrink-0 text-sm font-bold" style={{ color: q.flagged ? BAD_RED : TEXT_PRIMARY }}>
                  {q.avg5} <span className="font-normal" style={{ color: TEXT_TERTIARY }}>/5</span>
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {q.distribution.map((count, i) => {
                  const max = Math.max(1, ...q.distribution);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-8 text-xs" style={{ color: TEXT_TERTIARY }}>{i + 1}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded" style={{ backgroundColor: TRACK }}><div className="h-full rounded" style={{ width: `${(count / max) * 100}%`, backgroundColor: ACCENT }} /></div>
                      <span className="w-8 text-right text-xs" style={{ color: TEXT_TERTIARY }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Choice questions */}
      {choiceQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Multiple choice</h3>
          {choiceQuestions.map((q) => (
            <Card key={q.id} size={3}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{q.prompt}</p>
                {q.kind === 'multi' && <span className="shrink-0 text-xs" style={{ color: TEXT_TERTIARY }}>select-all</span>}
              </div>
              <div className="mt-3 space-y-1.5">
                {q.breakdown.map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="w-48 shrink-0 truncate text-xs" style={{ color: TEXT_SECONDARY }}>{b.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded" style={{ backgroundColor: TRACK }}><div className="h-full rounded" style={{ width: `${b.pct}%`, backgroundColor: ACCENT }} /></div>
                    <span className="w-16 text-right text-xs" style={{ color: TEXT_TERTIARY }}>{b.count} · {b.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Needs attention */}
      {flaggedResponders.length > 0 && (
        <Card size={3}>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Needs attention — scored ≤ 3 ({flaggedResponders.length})</h3>
          <div className="mt-3 space-y-3">
            {flaggedResponders.map((p, idx) => (
              <div key={`${p.email}-${idx}`}>
                {idx > 0 && <Divider />}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{p.name}</span>
                  <Tag color="red" size="regular">{p.avg5}/5</Tag>
                  <span className="font-mono text-xs" style={{ color: PLACEHOLDER }}>{p.platform ? `${p.platform} · ` : ''}{p.group ? `${p.group} · ` : ''}{p.recordedDate}</span>
                </div>
                {p.lowAreas.length > 0 && <p className="mt-1 text-xs" style={{ color: TEXT_TERTIARY }}>Low: {p.lowAreas.join(', ')}</p>}
                {p.verbatim && <p className="mt-1 text-sm italic" style={{ color: TEXT_SECONDARY }}>“{p.verbatim}”</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Verbatims */}
      {textQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><MessageSquare size={14} color={ACCENT} /> Open feedback</h3>
          {textQuestions.map((q) => (
            <Card key={q.id} size={3}>
              <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{q.prompt}</p>
              <div className="mt-3 space-y-1.5">
                {q.verbatims.map((v, i) => (
                  <p key={i} className="rounded-lg px-3 py-2 text-sm" style={{ color: TEXT_SECONDARY, backgroundColor: SUBTLE_FILL }}>
                    “{v.text}” <span className="text-xs" style={{ color: PLACEHOLDER }}>— {v.name}</span>
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Platform mix */}
      {platformBreakdown.length > 0 && (
        <Card size={3}>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Platform mix</h3>
          <div className="flex flex-wrap gap-2">
            {platformBreakdown.map((b) => <Tag key={b.label} color="grey" size="regular">{b.label}: {b.count} ({b.pct}%)</Tag>)}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Shared bits ──────────────────────────────────────────────────────────────
// Metric column — bold label over a muted value. Matches the Program Health
// view's HealthMetric so rows read identically across the section.
function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 leading-snug">
      <p className="truncate text-xs font-semibold" style={{ color: TEXT_PRIMARY }}>{label}</p>
      <div className="mt-1 truncate text-sm" style={{ color: TEXT_SECONDARY }}>{children}</div>
    </div>
  );
}

function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm" style={{ color: TEXT_TERTIARY }}>
      <ChevronLeft size={16} /> {label}
    </button>
  );
}
