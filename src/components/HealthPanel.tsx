'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { useState } from 'react';

export default function HealthPanel({ deviceId }: { deviceId: string }) {
  const { devices, getSpeedTests, addSpeedTest } = useDeviceStore();
  const [running, setRunning] = useState(false);

  const device = devices.find((d) => d.id === deviceId);
  const speedTests = getSpeedTests(deviceId);

  if (!device) return null;

  const handleRunTest = () => {
    setRunning(true);
    setTimeout(() => {
      // Simulate speed test with realistic values
      const baseDown = 85 + Math.random() * 40;
      const baseUp = 8 + Math.random() * 12;
      addSpeedTest({
        id: crypto.randomUUID(),
        deviceId,
        timestamp: new Date().toISOString(),
        downloadMbps: Math.round(baseDown * 100) / 100,
        uploadMbps: Math.round(baseUp * 100) / 100,
        firmwareVersion: device.firmwareVersion,
        flagged: false,
      });
      setRunning(false);
    }, 2000);
  };

  const latestTest = speedTests[0];
  const hasRegression = speedTests.some((t) => t.flagged);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Network Health</h4>
        <button
          onClick={handleRunTest}
          disabled={running}
          className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? 'Testing...' : 'Run Speed Test'}
        </button>
      </div>

      {hasRegression && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-700 font-medium">⚠️ Performance regression detected</p>
          <p className="text-xs text-red-600 mt-0.5">Speed dropped &gt;30% after firmware update</p>
        </div>
      )}

      {latestTest ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-md p-2 text-center">
              <p className="text-lg font-bold text-gray-900">{latestTest.downloadMbps.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Mbps Down</p>
            </div>
            <div className="bg-gray-50 rounded-md p-2 text-center">
              <p className="text-lg font-bold text-gray-900">{latestTest.uploadMbps.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Mbps Up</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Last tested: {new Date(latestTest.timestamp).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400">No speed tests recorded</p>
      )}

      {speedTests.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">History</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {speedTests.slice(0, 10).map((test) => (
              <div key={test.id} className={`flex items-center justify-between text-xs ${test.flagged ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                <span>{test.flagged ? '⚠️ ' : ''}{test.downloadMbps.toFixed(1)} / {test.uploadMbps.toFixed(1)} Mbps</span>
                <span className="text-gray-400">{new Date(test.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
