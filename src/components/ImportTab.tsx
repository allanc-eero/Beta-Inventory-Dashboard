'use client';

import { useState, useCallback } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, DeviceStatus, Program } from '@/types';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

// ─── Column Mapping Config ────────────────────────────────────────────────────
// Each entry: [deviceField, ...possibleColumnNames]
const COLUMN_MAP: [keyof Device, string[]][] = [
  ['serialNumber', ['serial_number', 'Serial Number', 'serial', 'SN']],
  ['model', ['model', 'Model', 'device_model']],
  ['manufacturer', ['manufacturer', 'Manufacturer', 'mfg']],
  ['revision', ['revision', 'Revision', 'rev']],
  ['revisionNotes', ['revision_notes', 'Revision Notes']],
  ['hardwareConfig', ['hardware_config', 'Hardware Config']],
  ['mac', ['mac', 'MAC', 'mac_address']],
  ['internalName', ['internal_name', 'Internal Name', 'codename']],
  ['sku', ['sku', 'SKU']],
  ['partNumber', ['part_number', 'Part Number']],
  ['country', ['country', 'Country']],
  ['adminId', ['admin_id', 'Admin ID']],
  ['unitId', ['unit_id', 'Unit ID', 'Unit Id', 'UID']],
  ['firmwareVersion', ['firmware_version', 'Firmware', 'firmware', 'FW Version']],
  ['assignedTo', ['assigned_to', 'Assigned To', 'holder', 'Tester Name', 'tester_name', 'Name']],
  ['assignedEmail', ['assigned_email', 'Email', 'email', 'Tester Email', 'tester_email']],
  ['contactEmail', ['contact_email', 'Contact Email', 'contact']],
  ['alternateEmail', ['alternate_email', 'Alternate Email', 'alt_email']],
  ['location', ['location', 'Location']],
  ['adminLocation', ['admin_location', 'Admin Location']],
  ['network', ['network', 'Network', 'Network ID', 'network_id', 'Net ID']],
  ['assetTag', ['asset_tag', 'Asset Tag']],
  ['poExpensify', ['po_expensify', 'PO', 'Sales Order', 'sales_order', 'SO']],
  ['accountingId', ['accounting_id', 'Accounting ID']],
  ['cost', ['cost', 'Cost']],
  ['purchaseDate', ['purchase_date', 'Purchase Date']],
  ['imei1', ['imei1', 'IMEI 1']],
  ['imei2', ['imei2', 'IMEI 2']],
  ['eid', ['eid', 'EID']],
  ['tracking', ['tracking', 'Tracking', 'Tracking Number', 'tracking_number']],
  ['jira', ['jira', 'JIRA', 'Jira']],
  ['checkedOutTo', ['checked_out_to', 'Checked Out To', 'Tester Name', 'tester_name', 'assigned_to', 'Assigned To']],
  ['checkedOutDate', ['checked_out_date', 'Checkout Date']],
  ['dueDate', ['due_date', 'Due Date', 'ETA', 'eta']],
  ['notes', ['notes', 'Notes']],
  ['testbedName', ['testbed_name', 'Testbed', 'Network Group', 'network_group']],
];

function resolveColumn(row: any, aliases: string[]): string {
  for (const alias of aliases) {
    if (row[alias]) return row[alias];
  }
  return '';
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Status & Program Mappers ─────────────────────────────────────────────────
function mapStatus(raw: string): DeviceStatus {
  const s = raw.toLowerCase().trim();
  if (s.includes('not online') || s === 'not_online') return 'not_online';
  if (s.includes('online')) return 'online';
  if (s.includes('repair')) return 'in_repair';
  if (s.includes('test')) return 'in_testing';
  if (s.includes('deactivat')) return 'deactivated';
  return 'online';
}

const PROGRAM_MAP: Record<string, Program> = {
  beta: 'beta', dogfood: 'dogfood', 'dog food': 'dogfood',
  prq: 'prq', pvt: 'pvt', evt: 'evt', dvt: 'dvt',
};

function mapProgram(raw: string): Program {
  return PROGRAM_MAP[raw.toLowerCase().trim()] || 'other';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImportTab() {
  const { addDevices, devices, clearAllData, updateDevice, upsertTesterProfile, getTesterProfile, getOptOuts } = useDeviceStore();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [optOutWarnings, setOptOutWarnings] = useState<{ email: string; name: string; reason: string; date: string; notes: string }[]>([]);

  const processCSV = useCallback((file: File) => {
    setImporting(true);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        let success = 0;
        const newDevices: Device[] = [];
        const optOutWarningsCollector: { email: string; name: string; reason: string; date: string; notes: string }[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Build device from column mapping
            const device = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Device;
            for (const [field, aliases] of COLUMN_MAP) {
              (device as any)[field] = resolveColumn(row, aliases);
            }

            // Special fields
            device.deactivated = (row['deactivated'] || row['Deactivated'] || 'no').toLowerCase() === 'yes';
            device.status = mapStatus(row['status'] || row['Status'] || 'online');
            device.program = mapProgram(row['program'] || row['Program'] || 'other');
            device.shipmentStatus = row['shipment_status'] || 'delivered';
            device.fcLocation = row['fc_location'] || '';
            device.leg1Carrier = row['leg1_carrier'] || '';
            device.leg1Tracking = row['leg1_tracking'] || device.tracking;
            device.leg1Date = row['leg1_date'] || '';
            device.leg2Carrier = row['leg2_carrier'] || '';
            device.leg2Tracking = row['leg2_tracking'] || '';
            device.leg2Date = row['leg2_date'] || '';
            device.testbedId = row['testbed_id'] || '';

            if (!device.serialNumber) {
              errors.push(`Row ${index + 2}: Missing serial number`);
              return;
            }

            // Tester profile: auto-fill from known profile, then upsert
            const email = device.assignedEmail?.toLowerCase().trim();

            // Check if this person has opted out
            if (email) {
              const optOuts = getOptOuts();
              const optOutRecord = optOuts.find((o) => o.personEmail.toLowerCase() === email);
              if (optOutRecord) {
                optOutWarningsCollector.push({
                  email,
                  name: optOutRecord.personName,
                  reason: optOutRecord.reason.replace(/_/g, ' '),
                  date: new Date(optOutRecord.optOutDate).toLocaleDateString(),
                  notes: optOutRecord.notes,
                });
              }
            }
            if (email) {
              const profile = getTesterProfile(email);
              if (profile) {
                if (!device.assignedTo) device.assignedTo = profile.name;
                if (!device.contactEmail) device.contactEmail = profile.contactEmail;
                if (!device.alternateEmail) device.alternateEmail = profile.alternateEmail;
                if (!device.country) device.country = profile.country;
                if (!device.location) device.location = profile.location;
                if (!device.network) device.network = profile.networkId;
                if (!device.adminId) device.adminId = profile.adminId;
                if (!device.checkedOutTo) device.checkedOutTo = profile.name;
              }
              upsertTesterProfile({
                email,
                name: device.assignedTo || '',
                contactEmail: device.contactEmail || '',
                alternateEmail: device.alternateEmail || '',
                country: device.country || '',
                location: device.location || '',
                networkId: device.network || '',
                adminId: device.unitId || device.adminId || '',
                internetSpeed: row['internet_speed'] || row['Internet Speed'] || '',
                programs: device.program ? [device.program] : [],
              });
            }

            // Upsert: update existing device or add new
            const existing = devices.find((d) => d.serialNumber.toLowerCase() === device.serialNumber.toLowerCase());
            if (existing) {
              const updates: Partial<Device> = {};
              (Object.keys(device) as (keyof Device)[]).forEach((key) => {
                if (key === 'id' || key === 'createdAt') return;
                const val = device[key];
                if (val !== undefined && val !== '' && val !== (existing as any)[key]) {
                  (updates as any)[key] = val;
                }
              });
              if (Object.keys(updates).length > 0) updateDevice(existing.id, updates);
            } else {
              newDevices.push(device);
            }
            success++;
          } catch (err) {
            errors.push(`Row ${index + 2}: ${(err as Error).message}`);
          }
        });

        if (newDevices.length > 0) addDevices(newDevices);
        setResult({ success, failed: errors.length, errors });
        if (optOutWarningsCollector.length > 0) setOptOutWarnings(optOutWarningsCollector);
        setImporting(false);
      },
      error: (error) => {
        setResult({ success: 0, failed: 1, errors: [error.message] });
        setImporting(false);
      },
    });
  }, [addDevices, updateDevice, devices, upsertTesterProfile, getTesterProfile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.tsv'))) processCSV(file);
  }, [processCSV]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
  };

  const COLUMN_GUIDE = [
    { field: 'Serial Number', aliases: 'serial_number, Serial Number, serial, SN' },
    { field: 'Model', aliases: 'model, Model, device_model' },
    { field: 'Manufacturer', aliases: 'manufacturer, Manufacturer, mfg' },
    { field: 'Firmware', aliases: 'firmware_version, Firmware, FW Version' },
    { field: 'Program', aliases: 'program, Program (beta/dogfood/prq/pvt)' },
    { field: 'Status', aliases: 'status, Status (online/not_online)' },
    { field: 'Assigned To', aliases: 'assigned_to, Tester Name, holder' },
    { field: 'Email', aliases: 'assigned_email, Tester Email, email' },
    { field: 'Location', aliases: 'location, Location' },
    { field: 'Internal Name', aliases: 'internal_name, Internal Name, codename' },
    { field: 'MAC', aliases: 'mac, MAC, mac_address' },
    { field: 'Notes', aliases: 'notes, Notes' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Import & Export</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV('serial_number,model,manufacturer,revision,internal_name,mac,sku,firmware_version,program,status,assigned_to,assigned_email,contact_email,alternate_email,location,network,notes\n', 'device-tracker-template.csv')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download size={14} /> Download Template
          </button>
          <button
            onClick={() => downloadCSV(Papa.unparse(devices), `device-tracker-export-${new Date().toISOString().split('T')[0]}.csv`)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download size={14} /> Export All ({devices.length})
          </button>
          <button
            onClick={() => { if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) clearAllData(); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear All Data
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
      >
        <FileSpreadsheet size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {importing ? 'Processing...' : 'Drop your spreadsheet here'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">Supports CSV and TSV files. Column headers are matched flexibly.</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
          <Upload size={16} /> Choose File
          <input type="file" accept=".csv,.tsv" onChange={handleFileSelect} className="hidden" />
        </label>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-xl p-4 border ${result.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.failed > 0 ? <AlertCircle size={18} className="text-yellow-600" /> : <CheckCircle size={18} className="text-green-600" />}
            <span className="font-medium">Import complete: {result.success} succeeded, {result.failed} failed</span>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => <p key={i} className="text-xs text-red-600">{err}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Opt-Out Warnings */}
      {optOutWarnings.length > 0 && (
        <div className="rounded-xl p-4 border bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-orange-600" />
            <span className="font-medium text-orange-800">⚠️ {optOutWarnings.length} person(s) in this import previously opted out</span>
          </div>
          <p className="text-xs text-orange-700 mb-3">These people were added to the system but had previously opted out. Review their reasons below before proceeding.</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {optOutWarnings.map((w, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{w.name}</span>
                  <span className="text-xs text-gray-500">{w.email}</span>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  <span className="font-medium">Opted out:</span> {w.date} · <span className="font-medium">Reason:</span> {w.reason}
                  {w.notes && <> · <span className="font-medium">Notes:</span> {w.notes}</>}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setOptOutWarnings([])}
            className="mt-3 text-xs text-orange-700 font-medium hover:text-orange-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Column mapping guide */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Supported Column Headers</h3>
        <p className="text-sm text-gray-500 mb-4">The importer recognizes multiple naming conventions:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {COLUMN_GUIDE.map((item) => (
            <div key={item.field} className="bg-gray-50 rounded-lg p-2">
              <p className="font-medium text-gray-700">{item.field}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.aliases}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
