// Program sheet upload (Device Ingestion page) → program cards + device rows.
//
// One row per device (or per tester still awaiting a device). Each distinct
// Program value either creates a NEW program, or — if a program with that name
// already exists — adds the sheet's testers/devices to it. Rows that already exist
// in the program are flagged and skipped. Pure + side-effect-free:
// parseProgramSheet validates and plans, applyProgramSheet shapes the records.
import type { Device } from '@/types';
import type { DemoProgram, DemoTester, Phase } from '@/components/programs/types';
import { toStoreDevice, slugify } from '@/components/programs/helpers';
import { programKey, deviceInProgram, deviceProgramName } from '@/lib/programs';

export type SheetRow = Record<string, unknown>;

export interface PlannedRow {
  rowNumber: number;  // 1-based sheet row (header = row 1)
  serial: string;     // '' = tester is on the program but has no device yet
  name: string;
  email: string;
  internalName: string;
  phase?: Phase;
  firmware: string;
  group: string;
  existingTesterId?: string; // tester already on the program → only their new device is added
}

export interface PlannedProgram {
  name: string;
  existingProgramId?: string; // set → rows are added to this program
  cohort: 'beta' | 'dogfood';
  phase?: Phase;
  rows: PlannedRow[];
  newTesterCount: number;
  deviceCount: number;
}

export interface SheetIssue {
  rowNumber: number;
  program: string;
  kind: 'skipped' | 'warning';
  message: string;
}

export interface SheetPlan {
  programs: PlannedProgram[];
  issues: SheetIssue[];
  missingColumns: string[];
}

// Columns mirror the Devices table, plus Program / Cohort / Tester Email to link
// each row to a program and a person. No Status column: online state is only known
// once the eero API sync checks the device.
export const SHEET_COLUMNS = [
  'Program', 'Cohort', 'Serial Number', 'Internal Name', 'Phase', 'Firmware', 'Group', 'Assigned To', 'Tester Email',
];

// Accepted header spellings (compared after lowercasing and stripping non-alphanumerics).
const ALIASES = {
  program: ['program', 'programname'],
  cohort: ['cohort', 'programtype', 'betaordogfood'],
  serial: ['serialnumber', 'serial', 'dsn', 'sn', 'deviceserial'],
  internalName: ['internalname'],
  phase: ['phase'],
  firmware: ['firmware', 'firmwareversion'],
  group: ['group', 'networkgroup', 'osupdategroup'],
  name: ['assignedto', 'testername', 'name', 'tester', 'fullname'],
  firstName: ['firstname'],
  lastName: ['lastname'],
  email: ['testeremail', 'email', 'emailaddress'],
} as const;

const PHASES: Phase[] = ['EVT', 'DVT', 'PVT'];

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

function pick(row: SheetRow, aliases: readonly string[]): string {
  for (const [k, v] of Object.entries(row)) {
    if (aliases.includes(norm(k))) return String(v ?? '').trim();
  }
  return '';
}

function hasColumn(headers: string[], aliases: readonly string[]) {
  return headers.some((h) => aliases.includes(norm(h)));
}

function parseCohort(raw: string): 'beta' | 'dogfood' | null {
  const v = raw.toLowerCase();
  if (v.includes('dogfood')) return 'dogfood';
  if (v.includes('beta')) return 'beta';
  return null;
}

export function parseProgramSheet(
  rows: SheetRow[],
  existing: { programs: DemoProgram[]; devices: Device[] },
): SheetPlan {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const missingColumns: string[] = [];
  if (!hasColumn(headers, ALIASES.program)) missingColumns.push('Program');
  if (!hasColumn(headers, ALIASES.email)) missingColumns.push('Tester Email');
  if (missingColumns.length) return { programs: [], issues: [], missingColumns };

  const issues: SheetIssue[] = [];
  const byProgram = new Map<string, PlannedProgram>();
  const seenSerials = new Map<string, number>();
  const seenTesterRows = new Map<string, number>(); // `${programKey}|${email}` → first row
  const programsByKey = new Map(existing.programs.map((p) => [programKey(p.name), p]));
  const deviceBySerial = new Map(existing.devices.map((d) => [d.serialNumber.toUpperCase(), d]));

  rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const program = pick(row, ALIASES.program);
    const email = pick(row, ALIASES.email).toLowerCase();
    const serial = pick(row, ALIASES.serial).toUpperCase().replace(/\s+/g, '');
    const name = pick(row, ALIASES.name) || `${pick(row, ALIASES.firstName)} ${pick(row, ALIASES.lastName)}`.trim() || email;
    const flag = (kind: SheetIssue['kind'], message: string) => issues.push({ rowNumber, program, kind, message });

    if (!program && !email && !serial) return; // blank row
    if (!program) { flag('skipped', 'No Program'); return; }
    if (!email) { flag('skipped', 'No Tester Email'); return; }

    const key = programKey(program);
    const target = programsByKey.get(key);
    const targetTester = target?.testers.find((t) => t.email.toLowerCase() === email);

    // ── Exact matches against what's already in the app ──
    if (serial) {
      const dupeRow = seenSerials.get(serial);
      if (dupeRow) { flag('skipped', `Serial ${serial} is also on row ${dupeRow}`); return; }
      const inApp = deviceBySerial.get(serial);
      if (inApp) {
        const sameProgram = target && deviceInProgram(inApp, target.name);
        flag('skipped', sameProgram && inApp.assignedEmail.toLowerCase() === email
          ? `Already in ${target!.name}: ${name} with ${serial}`
          : `Serial ${serial} is already in the app (${deviceProgramName(inApp) || 'no program'}, ${inApp.assignedTo || 'unassigned'})`);
        return;
      }
      seenSerials.set(serial, rowNumber);
    } else {
      if (targetTester) { flag('skipped', `Already in ${target!.name}: ${targetTester.name} (${email})`); return; }
      const dupeRow = seenTesterRows.get(`${key}|${email}`);
      if (dupeRow) { flag('skipped', `${email} is also on row ${dupeRow}`); return; }
    }
    if (!seenTesterRows.has(`${key}|${email}`)) seenTesterRows.set(`${key}|${email}`, rowNumber);

    if (target && !targetTester) {
      const sameName = target.testers.find((t) => t.name.trim().toLowerCase() === name.toLowerCase());
      if (sameName) flag('warning', `Same name as ${sameName.name} (${sameName.email}) already in ${target.name}, different email — added, check for a duplicate`);
    }

    let plan = byProgram.get(key);
    if (!plan) {
      const rawCohort = pick(row, ALIASES.cohort);
      let cohort = target?.cohort ?? parseCohort(rawCohort) ?? (rawCohort ? null : program.toLowerCase().includes('dogfood') ? 'dogfood' : 'beta');
      if (!cohort) { flag('warning', `Cohort "${rawCohort}" isn't beta or dogfood — using beta`); cohort = 'beta'; }
      plan = { name: target?.name ?? program, existingProgramId: target?.id, cohort, rows: [], newTesterCount: 0, deviceCount: 0 };
      byProgram.set(key, plan);
    }

    const rawPhase = pick(row, ALIASES.phase).toUpperCase();
    let phase: Phase | undefined;
    if (rawPhase) {
      if ((PHASES as string[]).includes(rawPhase)) phase = rawPhase as Phase;
      else flag('warning', `Phase "${rawPhase}" isn't EVT, DVT or PVT — left blank`);
    }
    if (phase && !plan.phase) plan.phase = phase;

    plan.rows.push({
      rowNumber, serial, name, email, phase,
      internalName: pick(row, ALIASES.internalName),
      firmware: pick(row, ALIASES.firmware),
      group: pick(row, ALIASES.group),
      existingTesterId: targetTester?.id,
    });
  });

  const programs = Array.from(byProgram.values()).map((p) => ({
    ...p,
    newTesterCount: new Set(p.rows.filter((r) => !r.existingTesterId).map((r) => r.email)).size,
    deviceCount: p.rows.filter((r) => r.serial).length,
  }));
  return { programs, issues, missingColumns };
}

function newTester(programId: string, programName: string, r: PlannedRow, n: number): DemoTester {
  return {
    id: `${programId}-t${Date.now().toString(36)}-${n}`,
    name: r.name,
    email: r.email,
    programName,
    technicalLevel: 'Intermediate',
    reliability: 0,
    avgResponseDays: 0,
    feedbackQuality: 0,
    deviceOnline: false,
    missedSurveys: 0,
    noSeedDevice: true, // devices come from the sheet, never simulated
  };
}

// Shape the plan into program records (new + updated) and device rows.
export function applyProgramSheet(plans: PlannedProgram[], programs: DemoProgram[]): {
  created: DemoProgram[];
  updated: DemoProgram[];
  devices: Device[];
} {
  const ids = programs.map((p) => p.id);
  const created: DemoProgram[] = [];
  const updated: DemoProgram[] = [];
  const devices: Device[] = [];

  plans.forEach((plan) => {
    const base: DemoProgram = plan.existingProgramId
      ? programs.find((p) => p.id === plan.existingProgramId)!
      : {
          id: slugify(plan.name, ids), name: plan.name, type: 'hardware', status: 'active',
          currentPhase: plan.phase, audienceSize: 0, devicesDeployed: 0, devicesOnline: 0,
          surveyResponseRate: 0, avgFeedbackQuality: 0, testers: [], cohort: plan.cohort, source: 'upload',
        };
    ids.push(base.id);

    const byEmail = new Map(base.testers.map((t) => [t.email.toLowerCase(), t]));
    const added: DemoTester[] = [];
    plan.rows.forEach((r) => {
      if (!byEmail.has(r.email)) {
        const t = newTester(base.id, base.name, r, added.length);
        byEmail.set(r.email, t);
        added.push(t);
      }
    });
    const testers = [...base.testers, ...added];
    const program: DemoProgram = {
      ...base,
      testers,
      // Not displayed (cards/Dashboard count from testers + deviceStore) — kept in step with the roster.
      audienceSize: testers.length,
      devicesDeployed: base.devicesDeployed + plan.deviceCount,
    };
    (plan.existingProgramId ? updated : created).push(program);

    plan.rows.filter((r) => r.serial).forEach((r) => {
      const tester = byEmail.get(r.email)!;
      const d = toStoreDevice(tester, { serial: r.serial, model: '', networkId: null, status: 'pending', firmware: r.firmware, source: 'live' }, program);
      devices.push({
        ...d,
        internalName: r.internalName || d.internalName,
        phase: r.phase,
        networkGroup: r.group,
      });
    });
  });

  return { created, updated, devices };
}
