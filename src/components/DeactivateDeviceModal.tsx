'use client';

import { useState, useEffect } from 'react';
import { Device } from '@/types';
import { useDeviceStore } from '@/store/deviceStore';

interface DeactivateDeviceModalProps {
  device: Device;
  onClose: () => void;
}

function generateReturnLabel(device: Device, reason: string) {
  const labelWindow = window.open('', '_blank', 'width=500,height=400');
  if (!labelWindow) return;

  labelWindow.document.write(`
    <html>
      <head>
        <title>Return Shipping Label — ${device.serialNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; margin: 0; }
          .label { border: 3px solid #000; padding: 24px; max-width: 450px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { font-size: 18px; margin: 0; }
          .header p { font-size: 11px; color: #666; margin: 4px 0 0; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 4px; }
          .section-content { font-size: 13px; font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .barcode { text-align: center; font-family: monospace; font-size: 16px; letter-spacing: 3px; padding: 12px; background: #f5f5f5; margin-top: 16px; }
          .instructions { font-size: 10px; color: #666; margin-top: 16px; padding-top: 12px; border-top: 1px solid #ddd; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <h1>RETURN SHIPPING LABEL</h1>
            <p>eero Device Return Program</p>
          </div>
          <div class="section">
            <div class="section-title">Ship To</div>
            <div class="section-content">eero Returns Center<br/>1 eero Way<br/>San Francisco, CA 94105</div>
          </div>
          <div class="section">
            <div class="section-title">From</div>
            <div class="section-content">${device.assignedTo || device.checkedOutTo || 'N/A'}</div>
            <div style="font-size: 12px; color: #444;">${device.assignedEmail || ''}</div>
            <div style="font-size: 12px; color: #444;">${device.location || ''}</div>
          </div>
          <div class="row">
            <div><div class="section-title">Serial Number</div><div class="section-content">${device.serialNumber}</div></div>
            <div><div class="section-title">Reason</div><div class="section-content">${reason.replace(/_/g, ' ')}</div></div>
          </div>
          <div class="row">
            <div><div class="section-title">Date</div><div class="section-content">${new Date().toLocaleDateString()}</div></div>
            <div><div class="section-title">Model</div><div class="section-content">${device.model}</div></div>
          </div>
          <div class="barcode">${device.serialNumber}</div>
          <div class="instructions">
            <strong>Instructions:</strong> Pack the device securely. Include all cables and accessories. Attach this label to the outside of the package. Drop off at any UPS/FedEx location.
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `);
  labelWindow.document.close();
}

function openReturnEmail(device: Device, reason: string) {
  const testerEmail = device.assignedEmail || '';
  const testerName = device.assignedTo || device.checkedOutTo || 'Team Member';
  const reasonText = reason === 'defective' ? 'a hardware defect' : 'end of program phase';

  const subject = encodeURIComponent(`[Action Required] Return eero device ${device.serialNumber}`);
  const body = encodeURIComponent(
`Hi ${testerName},

We need you to return your eero device (serial: ${device.serialNumber}) due to ${reasonText}.

Please follow these steps:
1. Disconnect the device from power and your network
2. Pack it securely in its original box (or any padded box)
3. Include all cables and accessories
4. Print the attached return shipping label and attach it to the outside of the package
5. Drop off at any UPS or FedEx location, or schedule a pickup

Please return the device within 7 business days.

Device Details:
- Serial: ${device.serialNumber}
- Model: ${device.model}
- Reason: ${reason.replace(/_/g, ' ')}

If you have any questions, please reply to this email.

Thank you,
Device Management Team`
  );

  window.open(`mailto:${testerEmail}?subject=${subject}&body=${body}`, '_self');
}

export default function DeactivateDeviceModal({ device, onClose }: DeactivateDeviceModalProps) {
  const { deactivateDevice } = useDeviceStore();
  const [reason, setReason] = useState<'returned_to_eero' | 'defective' | 'end_of_program' | 'lost'>('returned_to_eero');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'deactivating' | 'emailing' | 'done'>('idle');
  const [createJira, setCreateJira] = useState(true);

  const requiresReturn = reason === 'defective' || reason === 'end_of_program';

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDeactivate = async () => {
    setProcessing(true);

    if (reason === 'lost') {
      setApiStatus('deactivating');
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    if (requiresReturn && device.assignedEmail) {
      setApiStatus('emailing');
      await new Promise((resolve) => setTimeout(resolve, 500));
      generateReturnLabel(device, reason);
      setTimeout(() => { openReturnEmail(device, reason); }, 1000);
    }

    setApiStatus('done');
    deactivateDevice({
      id: crypto.randomUUID(),
      deviceId: device.id,
      serialNumber: device.serialNumber,
      reason,
      deactivatedAt: new Date().toISOString(),
      deactivatedBy: 'Admin',
      factoryReset: false,
      notes,
      previousStatus: device.status,
      previousAssignee: device.assignedEmail,
    });

    setTimeout(() => { setProcessing(false); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 top-12 z-40 bg-gray-50 overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Back link */}
        <p
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium mb-2"
          onClick={onClose}
        >
          ← Back to device
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Return to eero</h1>
        <p className="text-sm text-gray-500 mb-8">
          Process a device return, recall, or deactivation. A JIRA ticket will be created for tracking.
        </p>

        {/* Device summary card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Device Being Returned</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Serial Number</p>
              <p className="text-sm font-mono font-medium text-gray-900">{device.serialNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Model</p>
              <p className="text-sm text-gray-900">{device.model}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Assigned To</p>
              <p className="text-sm text-gray-900">{device.assignedTo || device.checkedOutTo || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{device.assignedEmail || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Program</p>
              <p className="text-sm text-gray-900">{device.program}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Status</p>
              <p className="text-sm text-gray-900">{device.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Firmware</p>
              <p className="text-sm font-mono text-gray-900">{device.firmwareVersion || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm text-gray-900">{device.location || '—'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">Return Details</h3>

          <div className="space-y-5">
            {/* Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for return</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as typeof reason)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="returned_to_eero">Returned to eero</option>
                  <option value="defective">Defective / Hardware issue</option>
                  <option value="end_of_program">End of program phase</option>
                  <option value="lost">Lost / Unrecoverable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JIRA Epic</label>
                <input
                  type="text"
                  readOnly
                  value={`${device.program.toUpperCase()}-RETURNS`}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            {/* Create JIRA */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createJira}
                  onChange={(e) => setCreateJira(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Create JIRA ticket for tracking</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                placeholder="Additional context about this return..."
              />
            </div>
          </div>
        </div>

        {/* What will happen section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">What will happen</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700">Device will be marked as <span className="font-medium">deactivated</span> in the system</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700">JIRA ticket created under your name in epic <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{device.program.toUpperCase()}-RETURNS</span></p>
            </div>
            {requiresReturn && (
              <>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-sm text-gray-700">Return email drafted to <span className="font-medium">{device.assignedEmail || 'assignee'}</span> with instructions</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <p className="text-sm text-gray-700">Shipping label generated for printing</p>
                </div>
              </>
            )}
            {reason === 'lost' && (
              <div className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5">⚠️</span>
                <p className="text-sm text-red-700 font-medium">Device will be remotely bricked via the Partner API — it will never connect to a network again</p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-gray-700">All actions logged to device audit trail</p>
            </div>
          </div>
        </div>

        {/* Brick confirmation — only for lost */}
        {reason === 'lost' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded border-red-300 mt-0.5"
              />
              <span className="text-sm text-red-700">
                I confirm this device is lost or unrecoverable and should be permanently bricked. This action cannot be undone.
              </span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pb-12">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            disabled={processing || (reason === 'lost' && !confirmed)}
            className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              reason === 'lost' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {apiStatus === 'deactivating' ? '⏳ Bricking device via API...' :
             apiStatus === 'emailing' ? '⏳ Generating return email...' :
             apiStatus === 'done' ? '✓ Done' :
             reason === 'lost' ? 'Brick & Deactivate Device' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
