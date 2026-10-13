'use client';

/**
 * Dashboard — the landing snapshot of the whole app.
 *
 * PREVIEW: lives at /demo-dashboard only. If we like it, add a 'dashboard' tab to
 * src/app/page.tsx and render <DashboardView onNavigate={handleSetActiveTab} />.
 *
 * Every figure is derived from the shared stores (devices, programs, offerings)
 * through ./dashboardData, so it matches the menus it links to.
 */
import { useMemo, useState } from 'react';
import { Card, Tag, Button, ProgressBar, Pagination } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { useBetaProgramsStore } from '@/store/betaProgramsStore';
import { useProgramsStore } from '@/store/programsStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore, matchesCohort } from '@/store/uiStore';
import { programEnumFor } from '@/components/programs/helpers';
import type { TabType } from '@/types';
import {
  greetingFor, notOnlineByProgram,
  comingUp, needsAttention, programRows, TimelineState, Severity,
} from './dashboardData';

const BORDER = 'var(--ui-background-layer-border-border-layer-page)';
const TEXT_PRIMARY = 'var(--ui-text-text-primary)';
const TEXT_SECONDARY = 'var(--ui-text-text-secondary)';
const TEXT_TERTIARY = 'var(--ui-text-text-tertiary)';

// % online → EDS fill class (tokens from the foundation Tailwind preset).
const ONLINE_BREAKPOINTS = { 0: 'bg-Red-red-5', 50: 'bg-Orange-orange-5', 80: 'bg-Green-green-6' };

const PROGRAMS_PER_PAGE = 6;

export default function DashboardView({ onNavigate }: { onNavigate: (tab: TabType) => void }) {
  const { devices } = useDeviceStore();
  const { programs } = useBetaProgramsStore();
  const { offerings } = useProgramsStore();
  const { currentUser } = useAuthStore();
  const { cohort } = useUiStore();

  // The header cohort lens applies here too, same as every other menu.
  const visibleDevices = useMemo(() => devices.filter((d) => matchesCohort(d, cohort)), [devices, cohort]);
  const visiblePrograms = useMemo(
    () => (cohort === 'all' ? programs : programs.filter((p) => programEnumFor(p) === cohort)),
    [programs, cohort],
  );

  const now = new Date();
  const timeline = useMemo(() => comingUp(offerings, visibleDevices, visiblePrograms), [offerings, visibleDevices, visiblePrograms]);
  const attention = useMemo(() => needsAttention(visibleDevices, visiblePrograms), [visibleDevices, visiblePrograms]);
  const rows = useMemo(() => programRows(visiblePrograms, visibleDevices), [visiblePrograms, visibleDevices]);
  // Programs at a glance: active only by default; "All programs" adds completed ones.
  // Six rows per page, with the page menu when there are more.
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [programPage, setProgramPage] = useState(1);
  const listedRows = showAllPrograms ? rows : rows.filter((r) => r.program.status === 'active');
  const programPages = Math.max(1, Math.ceil(listedRows.length / PROGRAMS_PER_PAGE));
  const currentProgramPage = Math.min(programPage, programPages);
  const pageRows = listedRows.slice((currentProgramPage - 1) * PROGRAMS_PER_PAGE, currentProgramPage * PROGRAMS_PER_PAGE);
  const notOnline = useMemo(() => notOnlineByProgram(visiblePrograms, visibleDevices), [visiblePrograms, visibleDevices]);

  const firstName = (currentUser?.name || '').split(/[\s(]/)[0];

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: TEXT_PRIMARY }}>
            {greetingFor(now)}{firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
      </div>

      {/* Programs at a glance */}
      <Card size={3}>
        <SectionTitle
          title={showAllPrograms ? 'Programs at a glance · all programs' : 'Programs at a glance · active programs'}
          extra={<Button type="text" label={showAllPrograms ? 'Active programs only' : 'All programs'} onClick={() => { setShowAllPrograms((v) => !v); setProgramPage(1); }} />}
        />
        {listedRows.length === 0
          ? <EmptyLine text={showAllPrograms ? 'No programs in this cohort.' : 'No active programs in this cohort.'} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Program', 'Cohort', 'Phase', 'Testers', 'Devices online', 'Start date', 'Finish date', 'OK2Street date', 'Status'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: TEXT_TERTIARY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ program: p, cohort: c, testers, deployed, online }) => (
                    <tr key={p.id} className="cursor-pointer hover:bg-[var(--ui-background-layer-layer-page-hover)]" style={{ borderBottom: `1px solid ${BORDER}` }} onClick={() => onNavigate('surveys')}>
                      <td className="px-3 py-3">
                        <p className="font-medium" style={{ color: TEXT_PRIMARY }}>{p.name}</p>
                        <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{p.type === 'feature' ? 'Feature' : 'Hardware'}</p>
                      </td>
                      <td className="px-3 py-3"><Tag color={c === 'dogfood' ? 'purple' : 'navy'} size="regular">{c === 'dogfood' ? 'Dogfood' : 'Beta'}</Tag></td>
                      <td className="px-3 py-3" style={{ color: TEXT_SECONDARY }}>{p.currentPhase || '—'}</td>
                      <td className="px-3 py-3" style={{ color: TEXT_SECONDARY }}>{testers}</td>
                      <td className="px-3 py-3" style={{ minWidth: 160 }}>
                        {p.type === 'feature'
                          ? <span style={{ color: TEXT_TERTIARY }}>—</span>
                          : <ProgressBar label={`${online} of ${deployed}`} percent={deployed ? Math.round((online / deployed) * 100) : 0} colorBreakpoints={ONLINE_BREAKPOINTS} />}
                      </td>
                      <td className="px-3 py-3" style={{ color: TEXT_SECONDARY }}>{fmtDay(p.startDate)}</td>
                      <td className="px-3 py-3" style={{ color: TEXT_SECONDARY }}>{fmtDay(p.finishDate)}</td>
                      <td className="px-3 py-3" style={{ color: TEXT_SECONDARY }}>{p.ok2StreetDate ? fmtDay(p.ok2StreetDate) : '—'}</td>
                      <td className="px-3 py-3"><Tag color={p.status === 'active' ? 'green' : 'grey'} size="regular">{p.status === 'active' ? 'Active program' : 'Program completed'}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {listedRows.length > PROGRAMS_PER_PAGE && (
                <div className="mt-2">
                  <Pagination
                    pagination={{ totalItems: listedRows.length, totalPages: programPages, hasPreviousPage: currentProgramPage > 1, hasNextPage: currentProgramPage < programPages }}
                    currentPage={currentProgramPage}
                    pageSize={PROGRAMS_PER_PAGE}
                    onPageChange={setProgramPage}
                    onNextPage={() => setProgramPage((n) => Math.min(programPages, n + 1))}
                    onPreviousPage={() => setProgramPage((n) => Math.max(1, n - 1))}
                    onPageSizeChange={() => setProgramPage(1)}
                    pageSizeOptions={[{ value: PROGRAMS_PER_PAGE, label: String(PROGRAMS_PER_PAGE) }]}
                    ln10_label={{ prevBtn: 'Previous', nextBtn: 'Next', pageBtn: 'Page', itemsPerPage: 'Per page', counter: (st, en, tot) => `Showing ${st}–${en} of ${tot}` }}
                  />
                </div>
              )}
            </div>
          )}
      </Card>

      {/* Coming up + needs attention */}
      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <Card size={3}>
          <SectionTitle title="Coming up" extra="Last 2 weeks → next 2 months" />
          {timeline.length === 0
            ? <EmptyLine text="No program dates or device due-backs in this window." />
            : (
              <ul className="flex flex-col">
                {timeline.slice(0, 8).map((t) => (
                  <li key={t.id}>
                    <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-[var(--ui-background-layer-layer-page-hover)]" onClick={() => onNavigate(t.tab)}>
                      <span className="w-14 shrink-0 text-xs font-semibold" style={{ color: t.state === 'overdue' ? 'var(--ui-core-red-red-6)' : t.state === 'soon' ? 'var(--ui-core-orange-orange-6)' : TEXT_TERTIARY }}>
                        {t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`truncate font-medium ${t.state === 'past' ? 'line-through' : ''}`} style={{ color: t.state === 'past' ? TEXT_TERTIARY : TEXT_PRIMARY }}>{t.title}</span>
                      <span className="truncate text-xs" style={{ color: TEXT_TERTIARY }}>{t.program}</span>
                      <span className="ml-auto shrink-0"><TimelineTag state={t.state} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </Card>

        <Card size={3}>
          <SectionTitle title="Needs attention" extra={attention.length ? `${attention.length} item${attention.length === 1 ? '' : 's'}` : undefined} />
          {attention.length === 0
            ? <EmptyLine text="✓ Nothing needs attention right now." />
            : (
              <ul className="flex flex-col gap-1">
                {attention.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-md px-2 py-2">
                    <SeverityDot severity={a.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{a.title}</p>
                      <p className="truncate text-xs" style={{ color: TEXT_TERTIARY }}>{a.detail}</p>
                    </div>
                    {a.action && <Button type="text" label={a.action} onClick={() => onNavigate(a.tab)} />}
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>

      {/* Not online, per program */}
      <Card size={3}>
        <SectionTitle title="Devices not online by program" extra={<Button type="text" label="View devices" onClick={() => onNavigate('devices')} />} />
        {notOnline.length === 0
          ? <EmptyLine text="No active hardware programs in this cohort." />
          : (
            <ul className="flex flex-col">
              {notOnline.map((r) => {
                const down = r.offline + r.awaiting;
                return (
                  <li key={r.id} className="flex items-center gap-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <SeverityDot severity={down === 0 ? 'low' : r.total && down / r.total >= 0.25 ? 'high' : 'medium'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{r.name}</p>
                      <p className="text-xs" style={{ color: TEXT_TERTIARY }}>
                        {r.total === 0 ? 'No devices assigned yet' : down === 0 ? 'All devices online' : `${r.offline} offline · ${r.awaiting} awaiting device`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold" style={{ color: down ? 'var(--ui-core-orange-orange-6)' : 'var(--ui-core-green-green-6)' }}>{down}</p>
                      <p className="text-xs" style={{ color: TEXT_TERTIARY }}>of {r.total} not online</p>
                    </div>
                    <Button type="text" label={r.id === 'no-program' ? 'View devices' : 'View roster'} onClick={() => onNavigate(r.id === 'no-program' ? 'devices' : 'surveys')} />
                  </li>
                );
              })}
            </ul>
          )}
      </Card>
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────────────
// "Oct 15, 2026" from an ISO date.
const fmtDay = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function SectionTitle({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase" style={{ color: TEXT_SECONDARY }}>{title}</p>
      {typeof extra === 'string' ? <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{extra}</span> : extra}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm" style={{ color: TEXT_TERTIARY }}>{text}</p>;
}

function TimelineTag({ state }: { state: TimelineState }) {
  const map: Record<TimelineState, { color: 'red' | 'grey' | 'orange' | 'periwinkle'; label: string }> = {
    overdue: { color: 'red', label: 'Overdue' },
    past: { color: 'grey', label: 'Passed' },
    soon: { color: 'orange', label: 'This week' },
    upcoming: { color: 'periwinkle', label: 'Upcoming' },
  };
  return <Tag color={map[state].color} size="regular">{map[state].label}</Tag>;
}

function SeverityDot({ severity }: { severity: Severity }) {
  const color = severity === 'high' ? 'var(--ui-core-red-red-6)' : severity === 'medium' ? 'var(--ui-core-orange-orange-5)' : 'var(--ui-core-gray-gray-5)';
  return <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-label={`${severity} priority`} />;
}
