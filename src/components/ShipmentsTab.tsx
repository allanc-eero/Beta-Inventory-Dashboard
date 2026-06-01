'use client';

import { useState, useRef, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Carrier, Shipment, Device, ShipmentStatus, DeviceStatus } from '@/types';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/store/authStore';

const CARRIERS: Carrier[] = ['UPS', 'USPS', 'FedEx', 'DHL', 'Other'];

const TRACKING_URLS: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  DHL: 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
  Other: '',
};

interface ParsedRow {
  name: string;
  tracking: string;
  alias: string;
  email: string;
  networkId: string;
  rowProduct: string;
  rowPhase: string;
  serials: string[];
}

function parseSpreadsheetInput(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return [];

  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('shipto') || firstLine.includes('tracking') || firstLine.includes('dsn') || firstLine.includes('serial') || firstLine.includes('name');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    // Split by tab (from spreadsheet paste) or multiple spaces
    const cols = line.split(/\t/).map((c) => c.trim()).filter(Boolean);

    if (cols.length === 0) return null;

    // Try to detect columns based on content
    // Pattern: Name, Tracking, Alias, DSN1, DSN2...
    // Tracking numbers are typically all digits, 10+ chars
    // Serials start with letters+digits, 16 chars
    // Names have spaces, aliases are single words

    const serials: string[] = [];
    let name = '';
    let tracking = '';
    let alias = '';

    cols.forEach((col) => {
      // Serial: 16 char alphanumeric starting with letters
      if (/^[A-Z0-9]{16}$/i.test(col)) {
        serials.push(col.toUpperCase());
      }
      // Tracking: mostly digits, 10+ chars
      else if (/^\d{7,}$/.test(col)) {
        tracking = col;
      }
      // Name: contains space (first + last name)
      else if (col.includes(' ') && !name) {
        name = col;
      }
      // Alias: single word, no spaces, short
      else if (!col.includes(' ') && col.length < 20 && !alias && !/^\d+$/.test(col)) {
        // Could be alias or name without space
        if (!name) {
          name = col;
        } else {
          alias = col;
        }
      }
    });

    if (serials.length === 0) return null;

    return { name, tracking, alias, email: '', networkId: '', rowProduct: '', rowPhase: '', serials };
  }).filter(Boolean) as ParsedRow[];
}

export default function ShipmentsTab({ showPendingReturns }: { showPendingReturns?: boolean }) {
  const { devices, addDevice, updateDevice, addShipment, markShipmentDelivered, getAllShipments, addHistoryEntry } = useDeviceStore();
  const { canEdit } = useAuthStore();
  const [activeView, setActiveView] = useState<'upload' | 'history' | 'pending_returns'>(showPendingReturns ? 'pending_returns' : 'upload');
  const [pasteInput, setPasteInput] = useState('');
  const [carrier, setCarrier] = useState<Carrier>('DHL');
  const [fcLocation, setFcLocation] = useState('');
  const [shipDate, setShipDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [program, setProgram] = useState('beta');
  const [productName, setProductName] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allShipments = getAllShipments();
  const pendingReturnDevices = devices.filter((d) => d.status === 'pending_return');

  // Detect program and product from filename
  const detectedProgram = useMemo(() => {
    if (!fileName) return '';
    const lower = fileName.toLowerCase();
    if (lower.includes('beta')) return 'beta';
    if (lower.includes('dogfood') || lower.includes('dog food') || lower.includes('dog_food')) return 'dogfood';
    if (lower.includes('prq')) return 'prq';
    if (lower.includes('pvt')) return 'pvt';
    if (lower.includes('evt')) return 'evt';
    if (lower.includes('dvt')) return 'dvt';
    return '';
  }, [fileName]);

  const detectedProduct = useMemo(() => {
    if (!fileName) return '';
    const lower = fileName.toLowerCase();
    // Known product names — grows as new ones are used
    const knownProducts = [...new Set(devices.map((d) => d.product).filter(Boolean))];
    for (const p of knownProducts) {
      if (lower.includes(p.toLowerCase())) return p;
    }
    // Common product names to detect
    if (lower.includes('foghorn')) return 'Foghorn';
    if (lower.includes('merci')) return 'Merci';
    return '';
  }, [fileName, devices]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

      // Map Excel rows to ParsedRows
      const rows: ParsedRow[] = jsonData.map((row) => {
        // Name: combine First Name + Last Name, or fall back to ShipTo/Name
        const firstName = row['First Name'] || row['first_name'] || row['FirstName'] || '';
        const lastName = row['Last Name'] || row['last_name'] || row['LastName'] || '';
        const name = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : (row['ShipTo'] || row['Name'] || row['name'] || row['Ship To'] || '');

        // Tracking
        const tracking = row['Tracking'] || row['TrackingLink'] || row['TrackingNumber'] || row['Tracking Number'] || row['tracking'] || row['Link'] || '';

        // Email
        const email = row['Email'] || row['email'] || row['Alias'] || row['alias'] || '';
        const alias = row['Alias'] || row['alias'] || row['Login'] || '';

        // Product & Phase from row (overrides filename detection if present)
        const rowProduct = row['Product'] || row['product'] || row['Product Name'] || '';
        const rowPhase = row['Phase'] || row['phase'] || row['Program'] || row['program'] || '';

        // Insight Network Link — extract network ID from URL or use as-is if numeric
        const insightLinkRaw = row['Insight Network Link'] || row['Network Link'] || row['Insight'] || row['Network ID'] || row['network_id'] || '';
        const insightLink = String(insightLinkRaw).trim();
        let networkId = '';
        if (insightLink && insightLink !== 'no network' && insightLink !== 'No Network') {
          // If it's a URL, extract the network ID
          const networkMatch = insightLink.match(/networks\/(\d+)/);
          if (networkMatch) {
            networkId = networkMatch[1];
          } else if (/^\d+$/.test(insightLink)) {
            // Plain number — use as-is
            networkId = insightLink;
          }
        }

        // Collect all Serial columns
        const serials: string[] = [];
        Object.keys(row).forEach((key) => {
          if ((key.toLowerCase().includes('dsn') || key.toLowerCase().includes('serial')) && row[key]) {
            const val = String(row[key]).trim();
            if (val && /^[A-Z0-9]{10,}$/i.test(val)) {
              serials.push(val.toUpperCase());
            }
          }
        });

        if (serials.length === 0) return null;
        return { name: String(name), tracking: String(tracking), alias: String(alias), email: String(email), networkId: String(networkId), rowProduct: String(rowProduct), rowPhase: String(rowPhase), serials };
      }).filter(Boolean) as ParsedRow[];

      // Auto-set product and phase from spreadsheet data
      if (rows.length > 0) {
        const firstRowPhase = rows[0].rowPhase?.toLowerCase().trim();
        const firstRowProduct = rows[0].rowProduct?.trim();
        if (firstRowPhase && ['beta', 'dogfood', 'prq', 'pvt', 'evt', 'dvt'].includes(firstRowPhase)) {
          setProgram(firstRowPhase);
        }
        if (firstRowProduct) {
          setProductName(firstRowProduct);
        }
      }

      setParsedRows(rows);
      setPasteInput('');
    };

    reader.readAsBinaryString(file);
  };

  const handleParse = () => {
    const rows = parseSpreadsheetInput(pasteInput);
    setParsedRows(rows);
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;

    const allSerials: string[] = [];
    let newDevices = 0;
    let updatedDevices = 0;

    parsedRows.forEach((row) => {
      row.serials.forEach((serial) => {
        allSerials.push(serial);
        const existing = devices.find((d) => d.serialNumber.toUpperCase() === serial.toUpperCase());

        if (existing) {
          // Update existing device with assignment + tracking + program
          updateDevice(existing.id, {
            assignedTo: row.name,
            assignedEmail: row.email || (row.alias ? `${row.alias}@amazon.com` : ''),
            checkedOutTo: row.name,
            network: row.networkId || undefined,
            leg2Tracking: row.tracking,
            leg2Carrier: carrier,
            leg2Date: shipDate,
            shipmentStatus: 'in_transit_to_tester' as ShipmentStatus,
            program: program as Device['program'],
            product: productName,
          });
          updatedDevices++;
        } else {
          // Create new device
          const newDevice: Device = {
            id: crypto.randomUUID(),
            serialNumber: serial,
            model: '',
            manufacturer: 'eero',
            revision: '',
            revisionNotes: '',
            hardwareConfig: '',
            mac: '',
            internalName: `${productName || row.rowProduct || ''} ${program.toUpperCase()}`.trim(),
            sku: '',
            partNumber: '',
            country: '',
            adminId: '',
            unitId: '',
            deactivated: false,
            firmwareVersion: '',
            status: 'not_online',
            assignedTo: row.name,
            assignedEmail: row.email || (row.alias ? `${row.alias}@amazon.com` : ''),
            contactEmail: '',
            alternateEmail: '',
            location: '',
            adminLocation: '',
            network: row.networkId || '',
            program: program as Device['program'],
            product: productName,
            assetTag: '',
            poExpensify: '',
            accountingId: '',
            cost: '',
            purchaseDate: '',
            imei1: '',
            imei2: '',
            eid: '',
            tracking: row.tracking,
            jira: '',
            checkedOutTo: row.name,
            checkedOutDate: shipDate,
            dueDate: '',
            notes: '',
            shipmentStatus: 'in_transit_to_tester',
            fcLocation: fcLocation,
            leg1Carrier: '',
            leg1Tracking: '',
            leg1Date: '',
            leg2Carrier: carrier,
            leg2Tracking: row.tracking,
            leg2Date: shipDate,
            testbedId: '',
            testbedName: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addDevice(newDevice);
          newDevices++;
        }

        // Add history entry for each device
        const deviceId = devices.find((d) => d.serialNumber.toUpperCase() === serial.toUpperCase())?.id || '';
        if (deviceId) {
          addHistoryEntry({
            id: crypto.randomUUID(),
            deviceId,
            timestamp: new Date().toISOString(),
            action: 'shipped_to_tester',
            user: 'System',
            description: `Shipped to ${row.name} via ${carrier} (${row.tracking})`,
          });
        }
      });
    });

    // Log as a shipment batch
    const shipment: Shipment = {
      id: crypto.randomUUID(),
      leg: 2,
      serials: allSerials,
      carrier,
      trackingNumber: 'batch-import',
      origin: fcLocation || 'Fulfillment Center',
      destination: 'Testers',
      status: 'in_transit',
      shippedDate: shipDate,
      notes: notes || `Imported ${parsedRows.length} allocations (${allSerials.length} devices)`,
      createdAt: new Date().toISOString(),
      fileName: fileName || undefined,
      deviceCount: allSerials.length,
      testerCount: parsedRows.length,
      program: program,
    };
    addShipment(shipment);

    setSuccessMsg(`✓ Imported ${allSerials.length} devices — ${newDevices} new, ${updatedDevices} updated`);
    setPasteInput('');
    setParsedRows([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const totalSerials = parsedRows.reduce((sum, r) => sum + r.serials.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Device Ingestion & Returns</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('upload')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Upload Allocation
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Ingestion History ({allShipments.length})
          </button>
          <button
            onClick={() => setActiveView('pending_returns')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === 'pending_returns' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'} ${pendingReturnDevices.length > 0 ? 'text-orange-600' : ''}`}
          >
            Pending Returns {pendingReturnDevices.length > 0 && `(${pendingReturnDevices.length})`}
          </button>
        </div>
      </div>

      {activeView === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Upload Allocation List</h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload an Excel file (.xlsx) or paste directly from your spreadsheet. Columns auto-detected: ShipTo, TrackingNumber, Alias, DSN 1, DSN 2, etc.
            </p>

            {/* File upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500', 'bg-blue-50'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                const file = e.dataTransfer.files[0];
                if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
                  // Trigger the same handler as file input
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  if (fileInputRef.current) {
                    fileInputRef.current.files = dataTransfer.files;
                    fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              {fileName ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">📄 {fileName}</p>
                  <p className="text-xs text-green-600 mt-1">✓ File loaded — {parsedRows.length} row(s) parsed</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileName('');
                      setParsedRows([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    ✕ Cancel upload
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">Drop an Excel file here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
                </div>
              )}
            </div>

            {/* Program/Product detection from filename */}
            {fileName && detectedProgram && detectedProgram !== program && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <p className="text-xs text-blue-800">
                  Detected phase: <strong>{detectedProgram.toUpperCase()}</strong> from filename. Currently set to <strong>{program.toUpperCase()}</strong>.
                </p>
                <button
                  onClick={() => setProgram(detectedProgram)}
                  className="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-300 rounded-md hover:bg-blue-100"
                >
                  Switch to {detectedProgram.toUpperCase()}
                </button>
              </div>
            )}
            {fileName && detectedProduct && detectedProduct !== productName && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <p className="text-xs text-purple-800">
                  Detected product: <strong>{detectedProduct}</strong> from filename.{productName ? ` Currently set to "${productName}".` : ' No product set yet.'}
                </p>
                <button
                  onClick={() => setProductName(detectedProduct)}
                  className="px-3 py-1 text-xs font-medium text-purple-700 border border-purple-300 rounded-md hover:bg-purple-100"
                >
                  Set to {detectedProduct}
                </button>
              </div>
            )}

            {/* Shipment metadata */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value as Carrier)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ship Date</label>
                <input
                  type="date"
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From FC</label>
                <input
                  type="text"
                  value={fcLocation}
                  onChange={(e) => setFcLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="FC-SFO"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phase</label>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="beta">Beta</option>
                  <option value="dogfood">Dogfood</option>
                  <option value="prq">PRQ</option>
                  <option value="pvt">PVT</option>
                  <option value="evt">EVT</option>
                  <option value="dvt">DVT</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  list="product-suggestions"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g. Foghorn, Merci"
                />
                <datalist id="product-suggestions">
                  {[...new Set(devices.map((d) => d.product).filter(Boolean))].map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Preview */}
            {parsedRows.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    Preview: {parsedRows.length} tester(s), {totalSerials} device(s)
                  </p>
                  <button
                    onClick={() => setParsedRows([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Edit
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Alias</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Tracking</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Serial(s)</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 text-gray-500">{row.alias}</td>
                          <td className="px-3 py-2 font-mono">{row.tracking}</td>
                          <td className="px-3 py-2 font-mono">{row.serials.join(', ')}</td>
                          <td className="px-3 py-2">
                            {row.serials.some((s) => devices.find((d) => d.serialNumber.toUpperCase() === s.toUpperCase()))
                              ? <span className="text-blue-600">Update</span>
                              : <span className="text-green-600">New</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleImport}
                  className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Import {totalSerials} Device(s) to System
                </button>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">{successMsg}</p>
                <p className="text-xs text-green-600 mt-1">Devices are now visible in the Devices tab with tracking info attached.</p>
              </div>
            )}
          </div>

          {/* Right sidebar — Pipeline + info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pipeline</h3>
              <PipelineSummary />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
              <ol className="space-y-2 text-xs text-gray-600">
                <li className="flex gap-2"><span className="font-bold text-gray-400">1.</span> Upload the Excel file or paste the allocation list</li>
                <li className="flex gap-2"><span className="font-bold text-gray-400">2.</span> Set the carrier, ship date, and FC origin</li>
                <li className="flex gap-2"><span className="font-bold text-gray-400">3.</span> Preview to verify names + serials parsed correctly</li>
                <li className="flex gap-2"><span className="font-bold text-gray-400">4.</span> Import — devices appear in the Devices tab with tracking</li>
                <li className="flex gap-2"><span className="font-bold text-gray-400">5.</span> Daily sync auto-detects when devices come online</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <ShipmentHistory shipments={allShipments} onMarkDelivered={markShipmentDelivered} />
      )}

      {activeView === 'pending_returns' && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-orange-800 mb-1">Pending Device Returns</h3>
            <p className="text-xs text-orange-700">
              These devices have been requested for return — a return email was sent to the tester. They remain here until you confirm the device has been physically received back. Devices overdue by 2+ weeks are highlighted in red.
            </p>
          </div>

          {pendingReturnDevices.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">No devices pending return</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email Sent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days Waiting</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingReturnDevices
                    .sort((a, b) => new Date(a.returnEmailSentAt || '').getTime() - new Date(b.returnEmailSentAt || '').getTime())
                    .map((d) => {
                      const daysSince = d.returnEmailSentAt
                        ? Math.floor((Date.now() - new Date(d.returnEmailSentAt).getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      const isOverdue = daysSince >= 14;
                      return (
                        <tr key={d.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">{d.serialNumber}</td>
                          <td className="px-4 py-3 text-gray-700">{d.assignedTo || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{d.assignedEmail || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {d.returnEmailSentAt ? new Date(d.returnEmailSentAt).toLocaleDateString() : '—'}
                            {d.returnEmailCount && d.returnEmailCount > 1 && (
                              <span className="ml-1 text-orange-600">({d.returnEmailCount}× sent)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              isOverdue ? 'bg-red-100 text-red-700' :
                              daysSince >= 7 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {daysSince} day{daysSince !== 1 ? 's' : ''}
                              {isOverdue && ' — OVERDUE'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {canEdit() ? (
                              <button
                                onClick={() => {
                                  updateDevice(d.id, { status: 'deactivated' as DeviceStatus, deactivated: true });
                                  addHistoryEntry({
                                    id: crypto.randomUUID(),
                                    deviceId: d.id,
                                    timestamp: new Date().toISOString(),
                                    action: 'return_confirmed',
                                    user: 'Admin',
                                    description: 'Device return confirmed. Removed from pending returns and marked as deactivated.',
                                  });
                                }}
                                className="px-3 py-1 text-xs font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50"
                              >
                                ✓ Confirm Received
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">View only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PipelineSummary() {
  const { devices } = useDeviceStore();

  const counts = {
    in_transit_to_tester: devices.filter((d) => d.shipmentStatus === 'in_transit_to_tester' || d.shipmentStatus === 'in_transit_to_fc' || d.shipmentStatus === 'at_fc' || d.shipmentStatus === 'delivered').length,
    online: devices.filter((d) => d.status === 'online').length,
    not_online: devices.filter((d) => d.status === 'not_online').length,
  };

  const stages = [
    { key: 'in_transit_to_tester', label: 'In Transit → Tester', color: 'bg-purple-100 text-purple-700' },
    { key: 'not_online', label: 'Not Online', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'online', label: 'Online', color: 'bg-green-200 text-green-800' },
  ];

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.key} className="flex items-center justify-between">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${stage.color}`}>
            {stage.label}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {counts[stage.key as keyof typeof counts]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ShipmentHistory({ shipments, onMarkDelivered }: { shipments: Shipment[]; onMarkDelivered: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (shipments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-sm">No uploads yet</p>
        <p className="text-gray-300 text-xs mt-1">Upload an allocation list to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{shipments.length}</p>
          <p className="text-xs text-gray-500">Total Uploads</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{shipments.reduce((sum, s) => sum + s.serials.length, 0)}</p>
          <p className="text-xs text-gray-500">Total Devices</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{shipments.filter((s) => s.status === 'in_transit').length}</p>
          <p className="text-xs text-gray-500">In Transit</p>
        </div>
      </div>

      {/* Upload history list */}
      <div className="space-y-3">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header row */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {shipment.fileName || 'Manual Import'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(shipment.createdAt).toLocaleString()} by Admin
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {shipment.status === 'in_transit' ? 'In Transit' : 'Delivered'}
                  </span>
                  {shipment.program && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {shipment.program}
                    </span>
                  )}
                  {shipment.status === 'in_transit' && (
                    <button
                      onClick={() => onMarkDelivered(shipment.id)}
                      className="text-xs font-medium px-2.5 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">{shipment.deviceCount || shipment.serials.length}</span> devices
                </span>
                {shipment.testerCount && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-gray-700">{shipment.testerCount}</span> testers
                  </span>
                )}
                <span>{shipment.carrier}</span>
                <span>Shipped: {new Date(shipment.shippedDate).toLocaleDateString()}</span>
                {shipment.origin && <span>From: {shipment.origin}</span>}
                {shipment.deliveredDate && (
                  <span className="text-green-600">Delivered: {new Date(shipment.deliveredDate).toLocaleDateString()}</span>
                )}
              </div>

              {shipment.notes && (
                <p className="mt-2 text-xs text-gray-400">{shipment.notes}</p>
              )}

              {/* Expand/collapse serials */}
              <button
                onClick={() => setExpandedId(expandedId === shipment.id ? null : shipment.id)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {expandedId === shipment.id ? 'Hide devices ▲' : `Show ${shipment.serials.length} devices ▼`}
              </button>
            </div>

            {/* Expanded serial list */}
            {expandedId === shipment.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {shipment.serials.map((serial) => (
                    <span key={serial} className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
                      {serial}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
