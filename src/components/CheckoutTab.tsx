'use client';

import { useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { CheckoutRecord } from '@/types';
import { ArrowRightLeft, Search, Printer } from 'lucide-react';

export default function CheckoutTab() {
  const { devices, checkoutDevice, checkinDevice, checkoutHistory } = useDeviceStore();
  const [serialInput, setSerialInput] = useState('');
  const [checkoutType, setCheckoutType] = useState<'person' | 'testbed'>('person');
  const [lastCheckedOutSerials, setLastCheckedOutSerials] = useState<string[]>([]);
  const [showPrintLabelPrompt, setShowPrintLabelPrompt] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [formData, setFormData] = useState({
    personEmail: '',
    jiraTicket: '',
    dueDate: '',
    notes: '',
    carrier: '',
    trackingNumber: '',
    location: '',
    quickClose: false,
  });

  const matchedDevices = serialInput
    ? devices.filter((d) =>
        d.serialNumber.toLowerCase().includes(serialInput.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    // Find devices matching the serial input (support comma-separated)
    const serials = serialInput.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

    if (serials.length === 0) {
      setCheckoutError('Please enter at least one device serial number.');
      return;
    }

    const targetDevices = devices.filter((d) =>
      serials.some((s) => d.serialNumber.toLowerCase() === s.toLowerCase())
    );

    if (targetDevices.length === 0) {
      setCheckoutError(`No devices found matching: ${serials.join(', ')}. Try selecting from the suggestions below the serial input.`);
      return;
    }

    // Prevent checking out devices that are already checked out
    const alreadyCheckedOut = targetDevices.filter((d) => d.checkedOutTo);
    if (alreadyCheckedOut.length > 0) {
      setCheckoutError(`Already checked out: ${alreadyCheckedOut.map((d) => d.serialNumber).join(', ')}. Check them in first.`);
      return;
    }

    targetDevices.forEach((device) => {
      const record: CheckoutRecord = {
        id: crypto.randomUUID(),
        deviceId: device.id,
        serialNumber: device.serialNumber,
        personEmail: formData.personEmail,
        personName: formData.personEmail.split('@')[0],
        checkoutDate: new Date().toISOString(),
        dueDate: formData.dueDate,
        returnDate: null,
        jiraTicket: formData.jiraTicket,
        notes: formData.notes,
        carrier: formData.carrier,
        trackingNumber: formData.trackingNumber,
        location: formData.location,
      };
      checkoutDevice(record);
    });

    // Track checked out serials for print label prompt
    setLastCheckedOutSerials(targetDevices.map((d) => d.serialNumber));
    setShowPrintLabelPrompt(true);

    // Reset form
    setSerialInput('');
    setFormData({
      personEmail: '',
      jiraTicket: '',
      dueDate: '',
      notes: '',
      carrier: '',
      trackingNumber: '',
      location: '',
      quickClose: false,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Check Out / Check In</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkout Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-blue-600" />
            Check Out Devices
          </h3>

          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Serial input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Device Serial(s) — scan or paste a list (comma, newline separated)
              </label>
              <textarea
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 font-mono"
                placeholder="Scan each device's serial, then submit the batch..."
              />
              {matchedDevices.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                  {matchedDevices.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSerialInput(d.serialNumber)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-mono font-medium">{d.serialNumber}</span>
                      <span className="text-gray-400 ml-2">{d.model} · {d.assignedTo || 'unassigned'}</span>
                    </button>
                  ))}
                </div>
              )}
              {checkoutError && (
                <p className="mt-1 text-xs text-red-600">{checkoutError}</p>
              )}
            </div>

            {/* Checkout type */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-medium text-gray-600">Check out to:</label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={checkoutType === 'person'}
                  onChange={() => setCheckoutType('person')}
                  className="text-blue-600"
                />
                Person (email)
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={checkoutType === 'testbed'}
                  onChange={() => setCheckoutType('testbed')}
                  className="text-blue-600"
                />
                Testbed
              </label>
            </div>

            {/* Person email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.personEmail}
                onChange={(e) => setFormData({ ...formData, personEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@company.com"
              />
            </div>

            {/* Jira */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                JIRA ticket
                <span className="text-gray-400 ml-1">(use a due date to keep the issue open)</span>
              </label>
              <input
                type="text"
                value={formData.jiraTicket}
                onChange={(e) => setFormData({ ...formData, jiraTicket: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="QA-12345 or https://jira.../browse/QA-12345"
              />
            </div>

            {/* Due date & quick close */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.quickClose}
                    onChange={(e) => setFormData({ ...formData, quickClose: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Quick close
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes (optional) — appended to the whole batch
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes..."
              />
            </div>

            {/* Carrier & Tracking */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Carrier & Tracking (optional)</label>
                <input
                  type="text"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="— No Carrier —"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tracking #</label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tracking # (optional)"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Device location (where devices will be)</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SFO38 (your default)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Check Out →
              </button>
              <button
                type="button"
                onClick={() => {
                  const serials = serialInput.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
                  const targetDevices = devices.filter((d) =>
                    serials.some((s) => d.serialNumber.toLowerCase() === s.toLowerCase())
                  );
                  const serialsToPrint = targetDevices.length > 0
                    ? targetDevices.map((d) => d.serialNumber)
                    : lastCheckedOutSerials;

                  if (serialsToPrint.length === 0) {
                    alert('Enter or scan a device serial first, or check out a device.');
                    return;
                  }

                  const labelWindow = window.open('', '_blank', 'width=400,height=300');
                  if (labelWindow) {
                    labelWindow.document.write(`
                      <html>
                        <head><title>Device Label</title>
                        <style>
                          body { font-family: monospace; padding: 20px; }
                          .label { border: 2px solid #000; padding: 16px; max-width: 350px; margin-bottom: 12px; }
                          .serial { font-size: 14px; font-weight: bold; margin: 4px 0; }
                          .meta { font-size: 11px; color: #555; margin: 2px 0; }
                          @media print { body { padding: 0; } }
                        </style></head>
                        <body>
                          ${serialsToPrint.map((serial) => `
                            <div class="label">
                              <div class="serial">${serial}</div>
                              <div class="meta">Date: ${new Date().toLocaleDateString()}</div>
                              ${formData.personEmail ? `<div class="meta">To: ${formData.personEmail}</div>` : ''}
                              ${formData.location ? `<div class="meta">Location: ${formData.location}</div>` : ''}
                              ${formData.carrier ? `<div class="meta">Carrier: ${formData.carrier}</div>` : ''}
                              ${formData.trackingNumber ? `<div class="meta">Tracking: ${formData.trackingNumber}</div>` : ''}
                            </div>
                          `).join('')}
                        </body>
                      </html>
                    `);
                    labelWindow.document.close();
                    labelWindow.print();
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Printer size={15} />
                Print Label
              </button>
            </div>

            {/* Print Label prompt after successful checkout */}
            {showPrintLabelPrompt && lastCheckedOutSerials.length > 0 && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      ✓ {lastCheckedOutSerials.length} device(s) checked out successfully
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {lastCheckedOutSerials.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Print label logic — opens browser print dialog with label content
                        const labelWindow = window.open('', '_blank', 'width=400,height=300');
                        if (labelWindow) {
                          labelWindow.document.write(`
                            <html>
                              <head><title>Device Label</title>
                              <style>
                                body { font-family: monospace; padding: 20px; }
                                .label { border: 2px solid #000; padding: 16px; max-width: 350px; }
                                .serial { font-size: 14px; font-weight: bold; margin: 4px 0; }
                                .meta { font-size: 11px; color: #555; margin: 2px 0; }
                                @media print { body { padding: 0; } }
                              </style></head>
                              <body>
                                ${lastCheckedOutSerials.map((serial) => `
                                  <div class="label">
                                    <div class="serial">${serial}</div>
                                    <div class="meta">Checked out: ${new Date().toLocaleDateString()}</div>
                                    <div class="meta">To: ${formData.personEmail || 'N/A'}</div>
                                    <div class="meta">Location: ${formData.location || 'N/A'}</div>
                                    ${formData.carrier ? `<div class="meta">Carrier: ${formData.carrier}</div>` : ''}
                                    ${formData.trackingNumber ? `<div class="meta">Tracking: ${formData.trackingNumber}</div>` : ''}
                                  </div>
                                  <br/>
                                `).join('')}
                              </body>
                            </html>
                          `);
                          labelWindow.document.close();
                          labelWindow.print();
                        }
                        setShowPrintLabelPrompt(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      <Printer size={14} />
                      Print Label
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPrintLabelPrompt(false)}
                      className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Recent checkout history */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Checkout History</h3>

          {checkoutHistory.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {checkoutHistory
                .slice()
                .reverse()
                .slice(0, 20)
                .map((record) => (
                  <div
                    key={record.id}
                    className={`p-3 rounded-lg border ${
                      record.returnDate ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium">{record.serialNumber}</span>
                      <span className={`text-xs font-medium ${record.returnDate ? 'text-green-700' : 'text-yellow-700'}`}>
                        {record.returnDate ? 'Returned' : 'Checked Out'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      <span>→ {record.personEmail}</span>
                      {record.dueDate && <span className="ml-2">Due: {record.dueDate}</span>}
                    </div>
                    {record.jiraTicket && (
                      <div className="mt-1 text-xs text-blue-600">{record.jiraTicket}</div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ArrowRightLeft size={32} className="mx-auto mb-2" />
              <p className="text-sm">No checkout history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
