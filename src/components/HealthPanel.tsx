'use client';

import { useDeviceStore } from '@/store/deviceStore';
import { useState } from 'react';
import { Card, Button } from '@amzn/eero-web-design-components';

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
    <Card
      size={2}
      title={
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ui-text-text-primary)]">Network Health</span>
          <Button
            type="primary"
            label={running ? 'Testing...' : 'Run Speed Test'}
            loading={running}
            disabled={running}
            onClick={handleRunTest}
          />
        </div>
      }
    >
      {hasRegression && (
        <div className="mb-3 p-2 bg-[var(--ui-support-fill-support-error)] border border-[var(--ui-support-border-support-error)] rounded-md">
          <p className="text-xs text-[var(--ui-support-text-support-error)] font-medium">⚠️ Performance regression detected</p>
          <p className="text-xs text-[var(--ui-core-red-red-6)] mt-0.5">Speed dropped &gt;30% after firmware update</p>
        </div>
      )}

      {latestTest ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--ui-background-layer-layer-page-hover)] rounded-md p-2 text-center">
              <p className="text-lg font-bold text-[var(--ui-text-text-primary)]">{latestTest.downloadMbps.toFixed(1)}</p>
              <p className="text-xs text-[var(--ui-text-text-tertiary)]">Mbps Down</p>
            </div>
            <div className="bg-[var(--ui-background-layer-layer-page-hover)] rounded-md p-2 text-center">
              <p className="text-lg font-bold text-[var(--ui-text-text-primary)]">{latestTest.uploadMbps.toFixed(1)}</p>
              <p className="text-xs text-[var(--ui-text-text-tertiary)]">Mbps Up</p>
            </div>
          </div>
          <p className="text-xs text-[var(--ui-text-text-placeholder)]">
            Last tested: {new Date(latestTest.timestamp).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-xs text-[var(--ui-text-text-placeholder)]">No speed tests recorded</p>
      )}

      {speedTests.length > 1 && (
        <div className="mt-3 pt-3 border-t border-[var(--ui-background-layer-border-border-layer-page)]">
          <p className="text-xs font-medium text-[var(--ui-text-text-tertiary)] mb-2">History</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {speedTests.slice(0, 10).map((test) => (
              <div key={test.id} className={`flex items-center justify-between text-xs ${test.flagged ? 'text-[var(--ui-core-red-red-6)] font-medium' : 'text-[var(--ui-text-text-tertiary)]'}`}>
                <span>{test.flagged ? '⚠️ ' : ''}{test.downloadMbps.toFixed(1)} / {test.uploadMbps.toFixed(1)} Mbps</span>
                <span className="text-[var(--ui-text-text-placeholder)]">{new Date(test.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
