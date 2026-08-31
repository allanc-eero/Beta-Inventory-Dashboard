'use client';

import { useState, useRef, useMemo } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Carrier, Shipment, Device, ShipmentStatus, DeviceStatus } from '@/types';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/store/authStore';
import JiraToast from './JiraToast';
import { createJiraIssue } from '@/services/jiraService';
import { CARRIERS, TRACKING_URLS, EPIC_MAP, JIRA_EPIC_KEY, getTrackingUrl, daysSince as daysSinceFn } from '@/constants';
import { Button, Select, Input, Tag, Card, Segmented } from '@amzn/eero-web-design-components';

interface ParsedRow {
  name: string;
  tracking: string;
  alias: string;
  email: string;
  networkId: string;
  rowProduct: string;
  rowPhase: string;
  country: string;
  address: string;
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

    return { name, tracking, alias, email: '', networkId: '', rowProduct: '', rowPhase: '', country: '', address: '', serials };
  }).filter(Boolean) as ParsedRow[];
}

export default function ShipmentsTab({ showPendingReturns }: { showPendingReturns?: boolean }) {
  const { devices, addDevice, updateDevice, addShipment, markShipmentDelivered, getAllShipments, addHistoryEntry, createJiraTicket } = useDeviceStore();
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
  const [shipDirection, setShipDirection] = useState<'outgoing' | 'incoming'>('outgoing');
  const [jiraToast, setJiraToast] = useState<{ ticketKey: string; summary: string; epicKey: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allShipments = getAllShipments();
  const pendingReturnDevices = devices.filter((d) => d.status === 'pending_return');
  // Devices the tester has marked shipped (entered a return tracking number via the portal)
  const testerShippedDevices = pendingReturnDevices.filter((d) => d.returnTrackingNumber);

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
      // Debug: log column headers for troubleshooting
      if (jsonData.length > 0) {
        console.log('[Upload] Detected columns:', Object.keys(jsonData[0]));
        console.log('[Upload] First row sample:', jsonData[0]);
      }
      const rows: ParsedRow[] = jsonData.map((row) => {
        // Name: combine First Name + Last Name, or fall back to ShipTo/Name
        const firstName = row['First Name'] || row['first_name'] || row['FirstName'] || '';
        const lastName = row['Last Name'] || row['last_name'] || row['LastName'] || '';
        const name = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : (row['ShipTo'] || row['Name'] || row['name'] || row['Ship To'] || '');

        // Tracking — handle URL tracking links (extract number) or plain tracking numbers
        let tracking = String(row['Tracking'] || row['TrackingLink'] || row['Tracking Link'] || row['TrackingNumber'] || row['Tracking Number'] || row['tracking'] || row['Link'] || '');
        // If tracking is a URL, try to extract the tracking number from it
        if (tracking && tracking.startsWith('http')) {
          const trackMatch = tracking.match(/[?&](?:tracknum|tLabels|trknbr|tracking-id)=([A-Z0-9]+)/i);
          if (trackMatch) tracking = trackMatch[1];
        }

        // Email
        const email = row['Email'] || row['email'] || row['Alias'] || row['alias'] || '';
        const alias = row['Alias'] || row['alias'] || row['Login'] || '';

        // Product & Phase from row (overrides filename detection if present)
        const rowProduct = row['Product'] || row['product'] || row['Product Name'] || '';
        const rowPhase = row['Phase'] || row['phase'] || row['Program'] || row['program'] || '';

        // Address & Country
        const country = row['Country'] || row['country'] || '';
        const address = row['Address'] || row['address'] || row['Location'] || row['location'] || '';

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

        // Collect all Serial columns — broad matching for column names
        const serials: string[] = [];
        Object.keys(row).forEach((key) => {
          const keyLower = key.toLowerCase();
          const isSerialColumn = keyLower.includes('dsn') || keyLower.includes('serial') || keyLower.includes('sn') || keyLower.includes('mac') || keyLower.includes('device id') || keyLower.includes('device_id') || keyLower.includes('imei') || keyLower.includes('unit');
          if (isSerialColumn && row[key]) {
            const val = String(row[key]).trim().replace(/\s+/g, ''); // strip spaces from serial values
            if (val && /^[A-Z0-9]{8,}$/i.test(val)) {
              serials.push(val.toUpperCase());
            }
          }
        });

        // Fallback: if no serials found by column name, check ALL columns for serial-shaped values (16+ alphanumeric)
        if (serials.length === 0) {
          Object.keys(row).forEach((key) => {
            if (row[key]) {
              const val = String(row[key]).trim().replace(/\s+/g, '');
              // Looks like a serial: 12+ alphanumeric chars, starts with letters
              if (/^[A-Z]{2,}[A-Z0-9]{10,}$/i.test(val) && val.length >= 12) {
                serials.push(val.toUpperCase());
              }
            }
          });
        }

        if (serials.length === 0) return null;
        return { name: String(name), tracking: String(tracking), alias: String(alias), email: String(email), networkId: String(networkId), rowProduct: String(rowProduct), rowPhase: String(rowPhase), country: String(country), address: String(address), serials };
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

  const handleImport = async () => {
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
            assignedEmail: row.email || (row.alias ? `${row.alias}@eero.com` : ''),
            checkedOutTo: row.name,
            network: row.networkId || undefined,
            country: row.country || existing.country,
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
            country: row.country || '',
            adminId: '',
            unitId: '',
            deactivated: false,
            firmwareVersion: '',
            status: 'not_online',
            assignedTo: row.name,
            assignedEmail: row.email || (row.alias ? `${row.alias}@eero.com` : ''),
            contactEmail: '',
            alternateEmail: '',
            location: row.address || '',
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

    // Direction-based logic: populate the correct Packages tab
    const uniqueTrackingNumbers = [...new Set(parsedRows.map((r) => r.tracking).filter(Boolean))];
    const now = new Date().toISOString();
    const epicKey = EPIC_MAP[program] || 'GENERAL-SHIPMENTS';

    if (shipDirection === 'incoming') {
      // ─── INCOMING: devices are imported above; nothing further to record ───
      setJiraToast({
        ticketKey: '',
        summary: `${parsedRows.length} inbound shipment(s) ingested`,
        epicKey: 'INBOUND',
      });

    } else {
      // ─── OUTGOING: Create ONE bulk JIRA ticket for the entire shipment ───
      // All testers, serials, and tracking numbers in one ticket for easy management
      const testerList = parsedRows.map((row) => {
        const name = row.name || row.email || 'Unassigned';
        const serialList = row.serials.join(', ');
        return `• ${name} — ${serialList} (Tracking: ${row.tracking || 'N/A'})`;
      }).join('\n');

      const jiraSummary = `[${epicKey}] ${productName || program.toUpperCase()} — ${allSerials.length} device(s) to ${parsedRows.length} tester(s)`;
      const jiraDescription = `Outgoing shipment batch uploaded on ${new Date().toLocaleDateString()}.\n\nProgram: ${program.toUpperCase()}\nProduct: ${productName || 'N/A'}\nCarrier: ${carrier}\nShip Date: ${shipDate}\nFrom: ${fcLocation || 'Fulfillment Center'}\nTotal Devices: ${allSerials.length}\nTotal Testers: ${parsedRows.length}\n\n--- TESTERS & DEVICES ---\n${testerList}`;

      // Create ONE real JIRA ticket via API
      const jiraResult = await createJiraIssue({
        summary: jiraSummary,
        description: jiraDescription,
        labels: ['inventory-dashboard', program, 'shipment', 'bulk'],
      });

      const ticketKey = jiraResult.success ? jiraResult.key : `LOCAL-${Math.floor(Math.random() * 90000) + 10000}`;
      const ticketUrl = jiraResult.success ? jiraResult.url : '';

      // Store in local JIRA tracker
      createJiraTicket({
        id: crypto.randomUUID(),
        key: ticketKey,
        deviceId: '',
        type: 'general',
        status: 'open',
        summary: jiraSummary,
        createdAt: now,
        url: ticketUrl || undefined,
      });

      setJiraToast({
        ticketKey,
        summary: jiraResult.success
          ? `JIRA ticket ${ticketKey} created — ${parsedRows.length} tester(s), ${allSerials.length} device(s)`
          : `Local ticket created (JIRA API failed: ${jiraResult.error})`,
        epicKey: 'BPM-1886',
      });
    }

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
      {/* JIRA Toast Notification */}
      {jiraToast && (
        <JiraToast
          ticketKey={jiraToast.ticketKey}
          summary={jiraToast.summary}
          epicKey={jiraToast.epicKey}
          onClose={() => setJiraToast(null)}
        />
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--ui-text-text-primary)]">Device Ingestion & Returns</h2>
        <Segmented
          value={activeView}
          onChange={(val) => setActiveView(val as 'upload' | 'history' | 'pending_returns')}
          items={[
            { value: 'upload', label: 'Upload Allocation' },
            { value: 'history', label: `Ingestion History (${allShipments.length})` },
            {
              value: 'pending_returns',
              label: (
                <span className="flex items-center gap-1.5">
                  Pending Returns {pendingReturnDevices.length > 0 && `(${pendingReturnDevices.length})`}
                  {testerShippedDevices.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-[var(--ui-core-periwinkle-periwinkle-6)] rounded-full" title={`${testerShippedDevices.length} shipped by tester`}>
                      {testerShippedDevices.length}
                    </span>
                  )}
                </span>
              ),
            },
          ]}
        />
      </div>

      {activeView === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload form */}
          <div className="lg:col-span-2">
          <Card size={5} title={<span className="font-semibold text-[var(--ui-text-text-primary)]">Upload Allocation List</span>}>
            <p className="text-xs text-[var(--ui-text-text-tertiary)] mb-4">
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
              className="border-2 border-dashed border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--ui-core-periwinkle-periwinkle-6)] hover:bg-[var(--ui-support-fill-support-info)] transition-colors"
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
                  <p className="text-sm font-medium text-[var(--ui-text-text-primary)]">📄 {fileName}</p>
                  <p className="text-xs text-[var(--ui-core-green-green-6)] mt-1">✓ File loaded — {parsedRows.length} row(s) parsed</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileName('');
                      setParsedRows([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-2 text-xs text-[var(--ui-core-red-red-6)] hover:text-[var(--ui-support-text-support-error)] font-medium"
                  >
                    ✕ Cancel upload
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[var(--ui-text-text-tertiary)]">Drop an Excel file here or click to browse</p>
                  <p className="text-xs text-[var(--ui-text-text-placeholder)] mt-1">Supports .xlsx, .xls, .csv</p>
                </div>
              )}
            </div>

            {/* Program/Product detection from filename */}
            {fileName && detectedProgram && detectedProgram !== program && (
              <div className="mt-3 p-3 bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] rounded-lg flex items-center justify-between">
                <p className="text-xs text-[var(--ui-support-text-icon-support-info)]">
                  Detected phase: <strong>{detectedProgram.toUpperCase()}</strong> from filename. Currently set to <strong>{program.toUpperCase()}</strong>.
                </p>
                <Button
                  type="default"
                  size="medium"
                  onClick={() => setProgram(detectedProgram)}
                  label={`Switch to ${detectedProgram.toUpperCase()}`}
                />
              </div>
            )}
            {fileName && detectedProduct && detectedProduct !== productName && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <p className="text-xs text-purple-800">
                  Detected product: <strong>{detectedProduct}</strong> from filename.{productName ? ` Currently set to "${productName}".` : ' No product set yet.'}
                </p>
                <Button
                  type="default"
                  size="medium"
                  onClick={() => setProductName(detectedProduct)}
                  label={`Set to ${detectedProduct}`}
                />
              </div>
            )}

            {/* Shipment metadata */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Direction</label>
                <Select
                  id="shipment-direction"
                  value={shipDirection}
                  onChange={(val) => setShipDirection(val as 'outgoing' | 'incoming')}
                  options={[
                    { value: 'outgoing', label: 'Outgoing (to testers)' },
                    { value: 'incoming', label: 'Incoming (to lab/warehouse)' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Carrier</label>
                <Select
                  id="shipment-carrier"
                  value={carrier}
                  onChange={(val) => setCarrier(val as Carrier)}
                  options={CARRIERS.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div>
                <Input
                  id="shipment-ship-date"
                  label="Ship Date"
                  layout="vertical"
                  type="date"
                  value={shipDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShipDate(e.target.value)}
                />
              </div>
              <div>
                <Input
                  id="shipment-from-fc"
                  label="From FC"
                  layout="vertical"
                  value={fcLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFcLocation(e.target.value)}
                  placeholder="FC-SFO"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-1">Phase</label>
                <Select
                  id="shipment-phase"
                  value={program}
                  onChange={(val) => setProgram(val)}
                  options={[
                    { value: 'beta', label: 'Beta' },
                    { value: 'dogfood', label: 'Dogfood' },
                    { value: 'prq', label: 'PRQ' },
                    { value: 'pvt', label: 'PVT' },
                    { value: 'evt', label: 'EVT' },
                    { value: 'dvt', label: 'DVT' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div>
                <Input
                  id="shipment-product"
                  label="Product"
                  layout="vertical"
                  value={productName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
                  list="product-suggestions"
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
                  <p className="text-sm font-medium text-[var(--ui-text-text-primary)]">
                    Preview: {parsedRows.length} tester(s), {totalSerials} device(s)
                  </p>
                  <Button
                    type="text"
                    size="medium"
                    onClick={() => setParsedRows([])}
                    label="Edit"
                  />
                </div>

                <div className="border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--ui-background-layer-layer-page-hover)] sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-[var(--ui-text-text-tertiary)]">Name</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--ui-text-text-tertiary)]">Alias</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--ui-text-text-tertiary)]">Tracking</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--ui-text-text-tertiary)]">Serial(s)</th>
                        <th className="text-left px-3 py-2 font-medium text-[var(--ui-text-text-tertiary)]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                      {parsedRows.map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--ui-background-layer-layer-page-hover)]">
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 text-[var(--ui-text-text-tertiary)]">{row.alias}</td>
                          <td className="px-3 py-2 font-mono">{row.tracking}</td>
                          <td className="px-3 py-2 font-mono">{row.serials.join(', ')}</td>
                          <td className="px-3 py-2">
                            {row.serials.some((s) => devices.find((d) => d.serialNumber.toUpperCase() === s.toUpperCase()))
                              ? <Tag color="periwinkle" size="regular">Update</Tag>
                              : <Tag color="green" size="regular">New</Tag>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <Button
                    type="primary"
                    fullWidth
                    onClick={handleImport}
                    label={`Import ${totalSerials} Device(s) to System`}
                  />
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-[var(--ui-support-fill-support-success)] border border-[var(--ui-support-border-support-success)] rounded-lg">
                <p className="text-sm text-[var(--ui-support-text-support-success)] font-medium">{successMsg}</p>
                <p className="text-xs text-[var(--ui-core-green-green-6)] mt-1">Devices are now visible in the Devices tab with tracking info attached.</p>
              </div>
            )}
          </Card>
          </div>

          {/* Right sidebar — Pipeline + info */}
          <div className="space-y-6">
            <Card size={5} title={<span className="font-semibold text-[var(--ui-text-text-primary)]">Pipeline</span>}>
              <PipelineSummary />
            </Card>

            <Card size={5} title={<span className="font-semibold text-[var(--ui-text-text-primary)]">How it works</span>}>
              <ol className="space-y-2 text-xs text-[var(--ui-text-text-tertiary)]">
                <li className="flex gap-2"><span className="font-bold text-[var(--ui-text-text-placeholder)]">1.</span> Upload the Excel file or paste the allocation list</li>
                <li className="flex gap-2"><span className="font-bold text-[var(--ui-text-text-placeholder)]">2.</span> Set the carrier, ship date, and FC origin</li>
                <li className="flex gap-2"><span className="font-bold text-[var(--ui-text-text-placeholder)]">3.</span> Preview to verify names + serials parsed correctly</li>
                <li className="flex gap-2"><span className="font-bold text-[var(--ui-text-text-placeholder)]">4.</span> Import — devices appear in the Devices tab with tracking</li>
                <li className="flex gap-2"><span className="font-bold text-[var(--ui-text-text-placeholder)]">5.</span> Daily sync auto-detects when devices come online</li>
              </ol>
            </Card>
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <ShipmentHistory shipments={allShipments} onMarkDelivered={markShipmentDelivered} />
      )}

      {activeView === 'pending_returns' && (
        <div className="space-y-4">
          {/* Shipped-by-tester alert — devices the tester confirmed shipped with a tracking # */}
          {testerShippedDevices.length > 0 && (
            <div className="bg-[var(--ui-support-fill-support-info)] border border-[var(--ui-support-border-support-info)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--ui-support-text-icon-support-info)] mb-1 flex items-center gap-2">
                📦 Shipped by Tester ({testerShippedDevices.length})
              </h3>
              <p className="text-xs text-[var(--ui-support-text-icon-support-info)] mb-3">
                These testers clicked "mark as returned" in their portal and provided a tracking number. Track the package, then confirm receipt below — from there you can archive or brick the device.
              </p>
              <div className="space-y-2">
                {testerShippedDevices.map((d) => {
                  const carrier = (d.leg2Carrier || d.leg1Carrier || '').toUpperCase();
                  const tn = d.returnTrackingNumber || '';
                  const trackUrl = getTrackingUrl(carrier, tn);
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-3 bg-[var(--ui-background-layer-layer-page)] border border-[var(--ui-support-border-support-info)] rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-medium text-[var(--ui-core-periwinkle-periwinkle-6)]">{d.serialNumber}</span>
                        <span className="text-xs text-[var(--ui-text-text-tertiary)] ml-2">{d.assignedTo || d.assignedEmail || 'unassigned'}</span>
                        {d.returnShippedAt && <span className="text-xs text-[var(--ui-text-text-placeholder)] ml-2">· marked shipped {new Date(d.returnShippedAt).toLocaleDateString()}</span>}
                      </div>
                      <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] hover:underline shrink-0">
                        {tn} ↗
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-[var(--ui-support-fill-support-warning)] border border-[var(--ui-support-border-support-warning)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--ui-support-text-icon-support-warning)] mb-1">Pending Device Returns</h3>
            <p className="text-xs text-[var(--ui-support-text-icon-support-warning)]">
              These devices have been requested for return — a return email was sent to the tester. They remain here until you confirm the device has been physically received back. Devices overdue by 2+ weeks are highlighted in red.
            </p>
          </div>

          {pendingReturnDevices.length === 0 ? (
            <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-12 text-center">
              <p className="text-[var(--ui-text-text-placeholder)] text-sm">No devices pending return</p>
            </div>
          ) : (
            <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Tester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Return Tracking</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Email Sent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Days Waiting</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
                  {pendingReturnDevices
                    .sort((a, b) => new Date(a.returnEmailSentAt || '').getTime() - new Date(b.returnEmailSentAt || '').getTime())
                    .map((d) => {
                      const daysOut = daysSinceFn(d.returnEmailSentAt);
                      const isOverdue = daysOut >= 14;
                      return (
                        <tr key={d.id} className={isOverdue ? 'bg-[var(--ui-support-fill-support-error)]' : 'hover:bg-[var(--ui-background-layer-layer-page-hover)]'}>
                          <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--ui-core-periwinkle-periwinkle-6)]">{d.serialNumber}</td>
                          <td className="px-4 py-3 text-[var(--ui-text-text-secondary)]">{d.assignedTo || '—'}</td>
                          <td className="px-4 py-3 text-[var(--ui-text-text-tertiary)] text-xs">{d.assignedEmail || '—'}</td>
                          <td className="px-4 py-3 text-xs">
                            {d.returnTrackingNumber ? (
                              <span className="font-mono text-[var(--ui-core-periwinkle-periwinkle-6)] font-medium">{d.returnTrackingNumber}</span>
                            ) : (
                              <span className="text-[var(--ui-text-text-placeholder)]">not shipped yet</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--ui-text-text-tertiary)]">
                            {d.returnEmailSentAt ? new Date(d.returnEmailSentAt).toLocaleDateString() : '—'}
                            {d.returnEmailCount && d.returnEmailCount > 1 && (
                              <span className="ml-1 text-[var(--ui-core-orange-orange-6)]">({d.returnEmailCount}× sent)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Tag color={isOverdue ? 'red' : daysOut >= 7 ? 'orange' : 'grey'} size="regular">
                              {daysOut} day{daysOut !== 1 ? 's' : ''}
                              {isOverdue && ' — OVERDUE'}
                            </Tag>
                          </td>
                          <td className="px-4 py-3">
                            {canEdit() ? (
                              <Button
                                type="default"
                                size="medium"
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
                                label="✓ Confirm Received"
                              />
                            ) : (
                              <span className="text-xs text-[var(--ui-text-text-placeholder)]">View only</span>
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

  const stages: { key: string; label: string; color: 'purple' | 'orange' | 'green' }[] = [
    { key: 'in_transit_to_tester', label: 'In Transit → Tester', color: 'purple' },
    { key: 'not_online', label: 'Not Online', color: 'orange' },
    { key: 'online', label: 'Online', color: 'green' },
  ];

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.key} className="flex items-center justify-between">
          <Tag color={stage.color} size="regular">
            {stage.label}
          </Tag>
          <span className="text-sm font-bold text-[var(--ui-text-text-primary)]">
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
      <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] p-12 text-center">
        <p className="text-[var(--ui-text-text-placeholder)] text-sm">No uploads yet</p>
        <p className="text-[var(--ui-text-text-disabled)] text-xs mt-1">Upload an allocation list to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card size={3} className="text-center">
          <p className="text-2xl font-bold text-[var(--ui-text-text-primary)]">{shipments.length}</p>
          <p className="text-xs text-[var(--ui-text-text-tertiary)]">Total Uploads</p>
        </Card>
        <Card size={3} className="text-center">
          <p className="text-2xl font-bold text-[var(--ui-text-text-primary)]">{shipments.reduce((sum, s) => sum + s.serials.length, 0)}</p>
          <p className="text-xs text-[var(--ui-text-text-tertiary)]">Total Devices</p>
        </Card>
        <Card size={3} className="text-center">
          <p className="text-2xl font-bold text-[var(--ui-text-text-primary)]">{shipments.filter((s) => s.status === 'in_transit').length}</p>
          <p className="text-xs text-[var(--ui-text-text-tertiary)]">In Transit</p>
        </Card>
      </div>

      {/* Upload history list */}
      <div className="space-y-3">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="bg-[var(--ui-background-layer-layer-page)] rounded-xl shadow-sm border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
            {/* Header row */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--ui-text-text-primary)]">
                      {shipment.fileName || 'Manual Import'}
                    </p>
                    <p className="text-xs text-[var(--ui-text-text-tertiary)]">
                      Uploaded {new Date(shipment.createdAt).toLocaleString()} by Admin
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color={shipment.status === 'in_transit' ? 'periwinkle' : 'green'} size="regular">
                    {shipment.status === 'in_transit' ? 'In Transit' : 'Delivered'}
                  </Tag>
                  {shipment.program && (
                    <Tag color="purple" size="regular">
                      {shipment.program}
                    </Tag>
                  )}
                  {shipment.status === 'in_transit' && (
                    <Button
                      type="primary"
                      size="medium"
                      onClick={() => onMarkDelivered(shipment.id)}
                      label="Mark Delivered"
                    />
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--ui-text-text-tertiary)]">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-[var(--ui-text-text-secondary)]">{shipment.deviceCount || shipment.serials.length}</span> devices
                </span>
                {shipment.testerCount && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-[var(--ui-text-text-secondary)]">{shipment.testerCount}</span> testers
                  </span>
                )}
                <span>{shipment.carrier}</span>
                <span>Shipped: {new Date(shipment.shippedDate).toLocaleDateString()}</span>
                {shipment.origin && <span>From: {shipment.origin}</span>}
                {shipment.deliveredDate && (
                  <span className="text-[var(--ui-core-green-green-6)]">Delivered: {new Date(shipment.deliveredDate).toLocaleDateString()}</span>
                )}
              </div>

              {shipment.notes && (
                <p className="mt-2 text-xs text-[var(--ui-text-text-placeholder)]">{shipment.notes}</p>
              )}

              {/* Expand/collapse serials */}
              <button
                onClick={() => setExpandedId(expandedId === shipment.id ? null : shipment.id)}
                className="mt-2 text-xs text-[var(--ui-core-periwinkle-periwinkle-6)] hover:text-[var(--ui-core-periwinkle-periwinkle-7)] font-medium"
              >
                {expandedId === shipment.id ? 'Hide devices ▲' : `Show ${shipment.serials.length} devices ▼`}
              </button>
            </div>

            {/* Expanded serial list */}
            {expandedId === shipment.id && (
              <div className="border-t border-[var(--ui-background-layer-border-border-layer-page)] bg-[var(--ui-background-layer-layer-page-hover)] p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {shipment.serials.map((serial) => (
                    <span key={serial} className="text-xs font-mono bg-[var(--ui-background-layer-layer-page)] px-2 py-1 rounded border border-[var(--ui-background-layer-border-border-layer-page)]">
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
