// Pure derivations for the Dashboard: everything is computed from the same stores
// the other menus read (devices, programs, offerings, history), so the numbers here
// always match what you see after clicking through.
import type { Device, ProgramOffering, TabType } from '@/types';
import type { DemoProgram } from '@/components/programs/types';
import { programEnumFor } from '@/components/programs/helpers';
import { deviceInProgram, deviceProgramName, liveProgramDevices } from '@/lib/programs';
import { isReturnOverdue } from '@/lib/format';

const DAY_MS = 24 * 60 * 60 * 1000;

export function greetingFor(date: Date) {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'never';
  const diff = now - new Date(iso).getTime();
  if (Number.isNaN(diff)) return 'never';
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────
export function fleetKpis(devices: Device[], programs: DemoProgram[]) {
  const live = devices.filter((d) => d.status !== 'deactivated');
  const online = live.filter((d) => d.status === 'online').length;
  const awaiting = live.filter((d) => d.status === 'not_online' && !d.network).length;
  return {
    programs: programs.length,
    activePrograms: programs.filter((p) => p.status === 'active').length,
    // Unique people on the programs' rosters — a tester on two programs counts once,
    // and a removed tester drops out immediately.
    testers: new Set(programs.flatMap((p) => p.testers.map((t) => t.email.toLowerCase().trim()))).size,
    devices: live.length,
    online,
    onlinePct: live.length ? Math.round((online / live.length) * 100) : 0,
    awaiting,
  };
}

// ─── Charts ───────────────────────────────────────────────────────────────────
export function fleetHealth(devices: Device[]) {
  const live = devices.filter((d) => d.status !== 'deactivated');
  const count = (s: Device['status'][]) => live.filter((d) => s.includes(d.status)).length;
  return [
    { name: 'Online', count: count(['online']), color: 'var(--ui-core-green-green-6)' },
    { name: 'Not online', count: count(['not_online']), color: 'var(--ui-core-gray-gray-5)' },
    { name: 'In repair / testing', count: count(['in_repair', 'in_testing']), color: 'var(--ui-core-orange-orange-5)' },
    { name: 'Pending return', count: count(['pending_return']), color: 'var(--ui-core-red-red-6)' },
  ].filter((i) => i.count > 0);
}

// ─── Coming up ────────────────────────────────────────────────────────────────
export type TimelineState = 'overdue' | 'past' | 'soon' | 'upcoming';
export interface TimelineItem {
  id: string;
  date: Date;
  title: string;
  program: string;
  state: TimelineState;
  tab: TabType;
}

// Program phase dates, sign-up deadlines, and device due-back dates, from two
// weeks back to two months out.
export function comingUp(offerings: ProgramOffering[], devices: Device[], now = new Date()): TimelineItem[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const from = today - 14 * DAY_MS;
  const to = today + 60 * DAY_MS;
  const items: TimelineItem[] = [];
  const stateFor = (t: number, overdueIfPast = false): TimelineState =>
    t < today ? (overdueIfPast ? 'overdue' : 'past') : t - today <= 7 * DAY_MS ? 'soon' : 'upcoming';
  const push = (id: string, iso: string | undefined, title: string, program: string, tab: TabType, overdueIfPast = false) => {
    if (!iso) return;
    const t = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
    if (Number.isNaN(t) || t < from || t > to) return;
    items.push({ id, date: new Date(t), title, program, state: stateFor(t, overdueIfPast), tab });
  };

  offerings.forEach((o) => {
    push(`${o.id}-signup`, o.signupDeadline, 'Sign-up deadline', o.name, 'surveys');
    push(`${o.id}-start`, o.startDate, 'Testing starts', o.name, 'surveys');
    (o.phases || []).forEach((ph) => {
      push(`${o.id}-${ph.name}-start`, ph.startDate, `${ph.name} starts`, o.name, 'surveys');
      push(`${o.id}-${ph.name}-end`, ph.endDate, `${ph.name} ends`, o.name, 'surveys');
    });
  });

  // Device due-back dates, grouped per day + program so a fleet doesn't flood the list.
  const due = new Map<string, number>();
  devices.forEach((d) => {
    if (!d.dueDate || d.status === 'deactivated') return;
    const key = `${d.dueDate.slice(0, 10)}|${deviceProgramName(d) || 'No program'}`;
    due.set(key, (due.get(key) || 0) + 1);
  });
  due.forEach((n, key) => {
    const [iso, program] = key.split('|');
    push(`due-${key}`, iso, `${n} device${n === 1 ? '' : 's'} due back`, program, 'shipments', true);
  });

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── Needs attention ──────────────────────────────────────────────────────────
export type Severity = 'high' | 'medium' | 'low';
export interface AttentionItem {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  tab: TabType;
  action: string;
}

export interface IntegrationHealth {
  key: string;
  label: string;
  ready: boolean;
}

export function needsAttention(devices: Device[], programs: DemoProgram[], integrations: IntegrationHealth[], now = Date.now()): AttentionItem[] {
  const items: AttentionItem[] = [];
  const add = (cond: number, item: Omit<AttentionItem, 'title'> & { title: (n: number) => string }) => {
    if (cond > 0) items.push({ ...item, title: item.title(cond) });
  };
  const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? '' : 's'}`;

  const pending = devices.filter((d) => d.status === 'pending_return');
  const overdue = pending.filter((d) => isReturnOverdue(d.returnEmailSentAt, now));
  const followUp = pending.filter((d) => d.returnEmailSentAt && !isReturnOverdue(d.returnEmailSentAt, now) && now - new Date(d.returnEmailSentAt).getTime() >= 7 * DAY_MS);
  const notOnlineYet = devices.filter((d) => d.status === 'not_online' && d.assignedEmail);
  const noGroup = devices.filter((d) => d.status === 'online' && !d.networkGroup);
  const noProgram = devices.filter((d) => d.status !== 'deactivated' && !deviceProgramName(d));
  // Only uploaded programs have a real roster↔device link today; seeded demo
  // programs simulate their devices, so they'd over-count here.
  const awaitingTesters = programs
    .filter((p) => p.source === 'upload' && p.status === 'active')
    .reduce((n, p) => n + p.testers.filter((t) => !devices.some((d) => deviceInProgram(d, p.name) && d.assignedEmail.toLowerCase() === t.email.toLowerCase())).length, 0);

  add(overdue.length, { id: 'overdue', severity: 'high', title: (n) => `${plural(n, 'device')} overdue for return`, detail: 'Return email sent 2+ weeks ago with no device back.', tab: 'shipments', action: 'View returns' });
  add(followUp.length, { id: 'follow-up', severity: 'medium', title: (n) => `${plural(n, 'return')} need a follow-up`, detail: 'Return email sent over a week ago.', tab: 'shipments', action: 'Send reminders' });
  add(notOnlineYet.length, { id: 'not-online', severity: 'medium', title: (n) => `${plural(n, 'assigned device')} not online`, detail: 'Assigned to a tester but not reporting on a network.', tab: 'devices', action: 'View devices' });
  add(awaitingTesters, { id: 'awaiting', severity: 'medium', title: (n) => `${plural(n, 'tester')} awaiting a device`, detail: 'On an active program roster with no serial assigned.', tab: 'surveys', action: 'Assign devices' });
  add(noGroup.length, { id: 'no-group', severity: 'low', title: (n) => `${plural(n, 'online device')} with no OS-update group`, detail: 'Their network has no release channel assigned.', tab: 'devices', action: 'View devices' });
  add(noProgram.length, { id: 'no-program', severity: 'low', title: (n) => `${plural(n, 'device')} with no program`, detail: 'Re-import with a Program column or set it on the device.', tab: 'devices', action: 'View devices' });

  integrations.filter((i) => !i.ready).forEach((i) => items.push({
    id: `int-${i.key}`, severity: 'low', title: `${i.label} not connected`,
    detail: 'Running on seeded/fallback data until credentials are added.', tab: 'devices', action: '',
  }));

  return items;
}

// ─── Not online, per program ─────────────────────────────────────────────────
// Live from deviceStore, so it moves the moment a network check or an edit lands.
export interface NotOnlineRow {
  id: string;
  name: string;
  offline: number;   // on a network but not reporting
  awaiting: number;  // not on a network yet
  total: number;     // the program's active devices
}

export function notOnlineByProgram(programs: DemoProgram[], devices: Device[]): NotOnlineRow[] {
  const live = devices.filter((d) => d.status !== 'deactivated' && d.status !== 'pending_return');
  const row = (id: string, name: string, mine: Device[]): NotOnlineRow => {
    const down = mine.filter((d) => d.status !== 'online');
    const awaiting = down.filter((d) => !d.network).length;
    return { id, name, awaiting, offline: down.length - awaiting, total: mine.length };
  };
  const rows = programs
    .filter((p) => p.type === 'hardware' && p.status === 'active')
    .map((p) => row(p.id, p.name, liveProgramDevices(live, p.name)));
  // '' = no program, including devices detached when their program was deleted.
  const unassigned = live.filter((d) => !deviceProgramName(d));
  if (unassigned.length) rows.push(row('no-program', 'No program', unassigned));
  return rows.sort((a, b) => (b.offline + b.awaiting) - (a.offline + a.awaiting) || b.total - a.total);
}

// ─── Programs at a glance ─────────────────────────────────────────────────────
export function programRows(programs: DemoProgram[], devices: Device[]) {
  return programs.map((p) => {
    const devs = p.type === 'feature' ? [] : liveProgramDevices(devices, p.name);
    return {
      program: p,
      cohort: programEnumFor(p) === 'dogfood' ? 'dogfood' as const : 'beta' as const,
      testers: p.testers.length,
      deployed: devs.length,
      online: devs.filter((d) => d.status === 'online').length,
    };
  });
}
