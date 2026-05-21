'use client';

import { useState, useCallback } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device, DeviceStatus, Program } from '@/types';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportTab() {
  const { addDevices, devices, clearAllData } = useDeviceStore();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

        results.data.forEach((row: any, index: number) => {
          try {
            // Map CSV columns to device fields (flexible column naming)
            const device: Device = {
              id: crypto.randomUUID(),
              serialNumber: row['serial_number'] || row['Serial Number'] || row['serial'] || row['SN'] || '',
              model: row['model'] || row['Model'] || row['device_model'] || '',
              manufacturer: row['manufacturer'] || row['Manufacturer'] || row['mfg'] || '',
              revision: row['revision'] || row['Revision'] || row['rev'] || '',
              revisionNotes: row['revision_notes'] || row['Revision Notes'] || '',
              hardwareConfig: row['hardware_config'] || row['Hardware Config'] || '',
              mac: row['mac'] || row['MAC'] || row['mac_address'] || '',
              internalName: row['internal_name'] || row['Internal Name'] || row['codename'] || '',
              sku: row['sku'] || row['SKU'] || '',
              partNumber: row['part_number'] || row['Part Number'] || '',
              country: row['country'] || row['Country'] || '',
              adminId: row['admin_id'] || row['Admin ID'] || '',
              unitId: row['unit_id'] || row['Unit ID'] || '',
              deactivated: (row['deactivated'] || row['Deactivated'] || 'no').toLowerCase() === 'yes',
              firmwareVersion: row['firmware_version'] || row['Firmware'] || row['firmware'] || row['FW Version'] || '',
              status: mapStatus(row['status'] || row['Status'] || 'in_stock'),
              assignedTo: row['assigned_to'] || row['Assigned To'] || row['holder'] || '',
              assignedEmail: row['assigned_email'] || row['Email'] || row['email'] || '',
              location: row['location'] || row['Location'] || '',
              adminLocation: row['admin_location'] || row['Admin Location'] || '',
              network: row['network'] || row['Network'] || '',
              program: mapProgram(row['program'] || row['Program'] || 'other'),
              assetTag: row['asset_tag'] || row['Asset Tag'] || '',
              poExpensify: row['po_expensify'] || row['PO'] || '',
              accountingId: row['accounting_id'] || row['Accounting ID'] || '',
              cost: row['cost'] || row['Cost'] || '',
              purchaseDate: row['purchase_date'] || row['Purchase Date'] || '',
              imei1: row['imei1'] || row['IMEI 1'] || '',
              imei2: row['imei2'] || row['IMEI 2'] || '',
              eid: row['eid'] || row['EID'] || '',
              tracking: row['tracking'] || row['Tracking'] || '',
              jira: row['jira'] || row['JIRA'] || row['Jira'] || '',
              checkedOutTo: row['checked_out_to'] || row['Checked Out To'] || '',
              checkedOutDate: row['checked_out_date'] || row['Checkout Date'] || '',
              dueDate: row['due_date'] || row['Due Date'] || '',
              notes: row['notes'] || row['Notes'] || '',
              shipmentStatus: row['shipment_status'] || 'delivered',
              fcLocation: row['fc_location'] || '',
              leg1Carrier: row['leg1_carrier'] || '',
              leg1Tracking: row['leg1_tracking'] || row['tracking'] || row['Tracking'] || '',
              leg1Date: row['leg1_date'] || '',
              leg2Carrier: row['leg2_carrier'] || '',
              leg2Tracking: row['leg2_tracking'] || '',
              leg2Date: row['leg2_date'] || '',
              testbedId: row['testbed_id'] || '',
              testbedName: row['testbed_name'] || row['Testbed'] || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            if (!device.serialNumber) {
              errors.push(`Row ${index + 2}: Missing serial number`);
              return;
            }

            newDevices.push(device);
            success++;
          } catch (err) {
            errors.push(`Row ${index + 2}: ${(err as Error).message}`);
          }
        });

        if (newDevices.length > 0) {
          addDevices(newDevices);
        }

        setResult({ success, failed: errors.length, errors });
        setImporting(false);
      },
      error: (error) => {
        setResult({ success: 0, failed: 1, errors: [error.message] });
        setImporting(false);
      },
    });
  }, [addDevices]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.tsv'))) {
      processCSV(file);
    }
  }, [processCSV]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSV(file);
  };

  const exportCSV = () => {
    const csv = Papa.unparse(devices);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = 'serial_number,model,manufacturer,revision,internal_name,mac,sku,firmware_version,program,status,assigned_to,assigned_email,location,notes\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'device-tracker-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Import & Export</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download size={14} />
            Download Template
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download size={14} />
            Export All ({devices.length})
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
                clearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
          >
            <Trash2 size={14} />
            Clear All Data
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
      >
        <FileSpreadsheet size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {importing ? 'Processing...' : 'Drop your spreadsheet here'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Supports CSV and TSV files. Column headers are matched flexibly.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
          <Upload size={16} />
          Choose File
          <input
            type="file"
            accept=".csv,.tsv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-xl p-4 border ${result.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.failed > 0 ? (
              <AlertCircle size={18} className="text-yellow-600" />
            ) : (
              <CheckCircle size={18} className="text-green-600" />
            )}
            <span className="font-medium">
              Import complete: {result.success} succeeded, {result.failed} failed
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Column mapping guide */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Supported Column Headers</h3>
        <p className="text-sm text-gray-500 mb-4">
          The importer recognizes multiple naming conventions. Use any of these column headers:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            { field: 'Serial Number', aliases: 'serial_number, Serial Number, serial, SN' },
            { field: 'Model', aliases: 'model, Model, device_model' },
            { field: 'Manufacturer', aliases: 'manufacturer, Manufacturer, mfg' },
            { field: 'Firmware', aliases: 'firmware_version, Firmware, FW Version' },
            { field: 'Program', aliases: 'program, Program (beta/dogfood/prq/pvt)' },
            { field: 'Status', aliases: 'status, Status (online/not_online)' },
            { field: 'Assigned To', aliases: 'assigned_to, Assigned To, holder' },
            { field: 'Email', aliases: 'assigned_email, Email, email' },
            { field: 'Location', aliases: 'location, Location' },
            { field: 'Internal Name', aliases: 'internal_name, Internal Name, codename' },
            { field: 'MAC', aliases: 'mac, MAC, mac_address' },
            { field: 'Notes', aliases: 'notes, Notes' },
          ].map((item) => (
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

function mapStatus(raw: string): DeviceStatus {
  const s = raw.toLowerCase().trim();
  if (s.includes('online') || s === 'online') return 'online';
  if (s.includes('not online') || s === 'not_online') return 'not_online';
  if (s.includes('repair')) return 'in_repair';
  if (s.includes('test')) return 'in_testing';
  if (s.includes('deactivat')) return 'deactivated';
  return 'online';
}

function mapProgram(raw: string): Program {
  const p = raw.toLowerCase().trim();
  if (p === 'beta') return 'beta';
  if (p === 'dogfood' || p === 'dog food') return 'dogfood';
  if (p === 'prq') return 'prq';
  if (p === 'pvt') return 'pvt';
  if (p === 'evt') return 'evt';
  if (p === 'dvt') return 'dvt';
  return 'other';
}
