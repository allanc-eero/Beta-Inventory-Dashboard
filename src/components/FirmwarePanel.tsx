'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { useState } from 'react';

export default function FirmwarePanel({ deviceId }: { deviceId: string }) {
  const { devices, latestFirmware, pushFirmwareUpdate, getDeviceHistory } = useDeviceStore();
  const [pushing, setPushing] = useState(false);

  const device = devices.find((d) => d.id === deviceId);
  if (!device) return null;

  const isOutdated = device.firmwareVersion && device.firmwareVersion !== latestFirmware.version;
  const firmwareHistory = getDeviceHistory(deviceId).filter((h) => h.action === 'firmware_updated');

  const handlePushUpdate = () => {
    setPushing(true);
    // Simulate firmware push delay
    setTimeout(() => {
      pushFirmwareUpdate(deviceId, latestFirmware.version);
      setPushing(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Firmware</h4>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Current Version</span>
          <span className={`text-xs font-mono font-medium ${isOutdated ? 'text-orange-600' : 'text-green-600'}`}>
            {device.firmwareVersion || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Latest Available</span>
          <span className="text-xs font-mono font-medium text-gray-900">{latestFirmware.version}</span>
        </div>

        {isOutdated && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-xs text-orange-700 font-medium">⚠️ Firmware is outdated</p>
            <button
              onClick={handlePushUpdate}
              disabled={pushing}
              className="mt-2 w-full px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pushing ? 'Pushing update...' : `Update to ${latestFirmware.version}`}
            </button>
          </div>
        )}

        {!isOutdated && device.firmwareVersion && (
          <p className="text-xs text-green-600 font-medium mt-1">✓ Up to date</p>
        )}
      </div>

      {firmwareHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Update History</p>
          <div className="space-y-1">
            {firmwareHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="text-xs text-gray-600">
                <span className="font-mono">{entry.oldValue}</span>
                <span className="mx-1">→</span>
                <span className="font-mono font-medium">{entry.newValue}</span>
                <span className="text-gray-400 ml-2">{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
