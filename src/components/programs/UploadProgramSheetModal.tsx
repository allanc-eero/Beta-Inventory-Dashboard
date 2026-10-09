'use client';

// Upload a tester/device sheet → each Program in it becomes a new program card
// (Programs page) and device container (Devices page), or — if the program already
// exists — its testers are added to it. Two steps: pick a file, then review what
// will be created/added and which rows are flagged before anything is written.
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Modal, Tag, Button } from '@amzn/eero-web-design-components';
import { useDeviceStore } from '@/store/deviceStore';
import { useBetaProgramsStore } from '@/store/betaProgramsStore';
import { parseProgramSheet, applyProgramSheet, SheetPlan, SheetRow, SHEET_COLUMNS } from '@/lib/programSheet';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from './theme';

const TEMPLATE_CSV = [
  SHEET_COLUMNS.join(','),
  'Foghorn PVT,beta,GGC4G70A611511ES,Foghorn PVT,PVT,,,Jake Decker,jake.decker@example.com',
  'Foghorn PVT,beta,,Foghorn PVT,PVT,,,Eric Busch,eric.busch@example.com',
].join('\n');

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'program-sheet-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function UploadProgramSheetModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (summary: string) => void;
}) {
  const { devices, addDevices, addPerson, getPersonByEmail, upsertTesterProfile } = useDeviceStore();
  const { programs, addPrograms, setPrograms } = useBetaProgramsStore();
  const [fileName, setFileName] = useState('');
  const [plan, setPlan] = useState<SheetPlan | null>(null);
  const [readError, setReadError] = useState('');

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setReadError('');
    try {
      // Read cells as text: otherwise CSV values like firmware "7.4.0" get parsed as dates.
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: true });
      const rows = XLSX.utils.sheet_to_json<SheetRow>(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
      setPlan(parseProgramSheet(rows, { programs, devices }));
    } catch {
      setPlan(null);
      setReadError("Couldn't read that file. Upload a .xlsx, .xls or .csv sheet.");
    }
  };

  const actionable = plan ? plan.programs.filter((p) => p.rows.length > 0) : [];
  const skipped = plan ? plan.issues.filter((i) => i.kind === 'skipped') : [];
  const warnings = plan ? plan.issues.filter((i) => i.kind === 'warning') : [];

  const apply = () => {
    const { created, updated, devices: newDevices } = applyProgramSheet(actionable, programs);
    const updatedById = new Map(updated.map((p) => [p.id, p]));
    if (updated.length) setPrograms((prev) => prev.map((p) => updatedById.get(p.id) ?? p));
    if (created.length) addPrograms(created);
    if (newDevices.length) addDevices(newDevices);
    // Testers show up in People right away, even before their device is online.
    [...created, ...updated].forEach((program) => program.testers.forEach((t) => {
      if (!getPersonByEmail(t.email)) addPerson({ id: crypto.randomUUID(), name: t.name, email: t.email, team: '', devices: [] });
      upsertTesterProfile({ email: t.email, name: t.name, programs: [program.name] });
    }));
    const testers = actionable.reduce((n, p) => n + p.newTesterCount, 0);
    const parts = [
      created.length && `created ${created.length} program${created.length === 1 ? '' : 's'}`,
      updated.length && `added to ${updated.length} existing`,
    ].filter(Boolean).join(', ');
    onCreated(`${fileName}: ${parts} — ${testers} new tester${testers === 1 ? '' : 's'}, ${newDevices.length} device${newDevices.length === 1 ? '' : 's'}${skipped.length ? ` (${skipped.length} row${skipped.length === 1 ? '' : 's'} skipped)` : ''}`);
  };

  return (
    <Modal
      isOpen
      title="Upload program sheet"
      onCancel={onClose}
      onOk={apply}
      okText="Import"
      cancelText="Cancel"
      okButtonProps={{ disabled: actionable.length === 0 }}
    >
      <div className="space-y-4 text-sm">
        <p style={{ color: TEXT_SECONDARY }}>
          One row per device. A new <b>Program</b> name creates a program card and a Devices container; an existing name adds the
          testers to that program. Rows already in the program are flagged and skipped.
        </p>
        <p className="text-xs" style={{ color: TEXT_TERTIARY }}>
          Columns: {SHEET_COLUMNS.join(', ')}. <b>Program</b> and <b>Tester Email</b> are required. Leave Serial Number blank for
          testers still awaiting a device.
        </p>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
            {fileName ? 'Choose a different file' : 'Choose file'}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
          </label>
          {fileName && <span className="truncate text-xs" style={{ color: TEXT_TERTIARY }}>{fileName}</span>}
          <div className="ml-auto"><Button type="text" label="Download template" onClick={downloadTemplate} /></div>
        </div>

        {readError && <p className="text-xs text-[var(--ui-support-text-support-error)]">{readError}</p>}

        {plan && plan.missingColumns.length > 0 && (
          <p className="text-xs text-[var(--ui-support-text-support-error)]">
            Missing required column{plan.missingColumns.length > 1 ? 's' : ''}: {plan.missingColumns.join(', ')}.
          </p>
        )}

        {plan && plan.missingColumns.length === 0 && actionable.length === 0 && (
          <p className="text-xs" style={{ color: TEXT_TERTIARY }}>Nothing new to import from this sheet.</p>
        )}

        {actionable.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase" style={{ color: TEXT_TERTIARY }}>What will be imported</p>
            {actionable.map((p) => (
              <div key={p.name} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
                <span className="font-medium" style={{ color: TEXT_PRIMARY }}>{p.name}</span>
                <Tag color={p.existingProgramId ? 'grey' : 'green'} size="regular">{p.existingProgramId ? 'Add to existing' : 'New program'}</Tag>
                <Tag color={p.cohort === 'dogfood' ? 'purple' : 'navy'} size="regular">{p.cohort === 'dogfood' ? 'Dogfood · stage' : 'Beta · prod'}</Tag>
                {p.phase && <Tag color="periwinkle-4" size="regular">{p.phase}</Tag>}
                <span className="ml-auto text-xs" style={{ color: TEXT_SECONDARY }}>
                  {p.newTesterCount} new tester{p.newTesterCount === 1 ? '' : 's'} · {p.deviceCount} device{p.deviceCount === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}

        {skipped.length > 0 && (
          <IssueList title={`${skipped.length} row${skipped.length === 1 ? '' : 's'} flagged and skipped`} tone="error" items={skipped} />
        )}
        {warnings.length > 0 && (
          <IssueList title={`${warnings.length} warning${warnings.length === 1 ? '' : 's'}`} tone="warn" items={warnings} />
        )}
      </div>
    </Modal>
  );
}

function IssueList({ title, tone, items }: { title: string; tone: 'error' | 'warn'; items: SheetPlan['issues'] }) {
  return (
    <div className="space-y-1">
      <p className={`text-xs font-semibold uppercase ${tone === 'error' ? 'text-[var(--ui-support-text-support-error)]' : 'text-[var(--ui-core-orange-orange-6)]'}`}>{title}</p>
      <ul className="max-h-40 overflow-y-auto text-xs" style={{ color: TEXT_SECONDARY }}>
        {items.map((iss, i) => <li key={i}>Row {iss.rowNumber}{iss.program ? ` · ${iss.program}` : ''}: {iss.message}</li>)}
      </ul>
    </div>
  );
}
