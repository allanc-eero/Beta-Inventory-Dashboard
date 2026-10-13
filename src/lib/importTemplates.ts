// The Imports upload (program sheet) — exact columns, what each one drives in the
// app, and a downloadable CSV template. Shown in the Imports "How it works" card and
// used by the program-sheet upload window, so the docs and the parser never drift.
import { SHEET_COLUMNS } from '@/lib/programSheet';

export interface ColumnSpec {
  name: string;
  required: boolean;
  what: string; // what to put in it + what it drives in the app
}

// Program sheet → program cards, Devices containers, rosters, People.
// Header names must match (case/spacing don't matter). One row per device.
export const PROGRAM_SHEET_COLUMNS: ColumnSpec[] = [
  { name: 'Program', required: true, what: 'Program name, spelled the same on every row. A new name creates the program card + Devices container; an existing name adds to it.' },
  { name: 'Tester Email', required: true, what: "The tester's eero-account email. Links them across Programs, People and Devices." },
  { name: 'Assigned To', required: true, what: "Tester's full name, as shown in the lists." },
  { name: 'Serial Number', required: true, what: 'Device serial (DSN). Two devices = two rows. Cell may be blank if their device isn\'t assigned yet ("Awaiting device").' },
  { name: 'Cohort', required: true, what: 'beta or dogfood — decides prod vs stage.' },
  { name: 'Phase', required: true, what: 'EVT, DVT or PVT. Shown on the program card and each device.' },
  { name: 'Start Date', required: true, what: 'When testing starts (YYYY-MM-DD or MM/DD/YYYY). Same on every row of a program.' },
  { name: 'Finish Date', required: true, what: "When testing ends — the testers' devices are due back then. Shows on the program card and the Dashboard's Coming up." },
  { name: 'OK2Street Date', required: false, what: 'Optional — the OK2Street (launch) date. Shows on the Dashboard and in Coming up.' },
  { name: 'Internal Name', required: true, what: 'Device label in the Devices list (e.g. "Foghorn PVT").' },
  { name: 'Firmware', required: true, what: 'Firmware version if known. Cell may be blank — the online check fills it in.' },
  { name: 'Group', required: true, what: 'OS-update group if known. Cell may be blank — the online check fills it in.' },
];

const csv = (rows: string[][]) => rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n');

export const PROGRAM_SHEET_TEMPLATE = csv([
  SHEET_COLUMNS,
  // [Program, Cohort, Serial Number, Internal Name, Phase, Start Date, Finish Date, OK2Street Date, Firmware, Group, Assigned To, Tester Email]
  ['Foghorn PVT', 'beta', 'GGC4G70A611511ES', 'Foghorn PVT', 'PVT', '2026-10-15', '2026-12-15', '2027-01-20', '', '', 'Jake Decker', 'jake.decker@example.com'],
  ['Foghorn PVT', 'beta', 'GGC4G70A611512EC', 'Foghorn PVT', 'PVT', '2026-10-15', '2026-12-15', '2027-01-20', '', '', 'Jake Decker', 'jake.decker@example.com'],
  ['Foghorn PVT', 'beta', '', 'Foghorn PVT', 'PVT', '2026-10-15', '2026-12-15', '2027-01-20', '', '', 'Eric Busch', 'eric.busch@example.com'],
]);

export function downloadCsv(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export const downloadProgramSheetTemplate = () => downloadCsv('program-sheet-template.csv', PROGRAM_SHEET_TEMPLATE);
