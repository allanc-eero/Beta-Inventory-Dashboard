'use client';

// ─── EDS verification page (from eds-installer.md) ────────────────────────────
// Temporary: confirms WDS components render with eero styling (periwinkle
// button, Centra No2 font). Safe to delete after verification.

import { Button, Tag, Card } from '@amzn/eero-web-design-components';

export default function EDSCheck() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card title="EDS Installed" size={2}>
        <div className="flex items-center gap-3">
          <Button type="primary" label="Working" />
          <Tag color="green" size="regular">
            Ready
          </Tag>
        </div>
      </Card>
    </div>
  );
}
