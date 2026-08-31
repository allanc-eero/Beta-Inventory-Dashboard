'use client';

import { useState } from 'react';
import { Tabs } from '@amzn/eero-web-design-components';
import InboundPackages from './InboundPackages';
import OutboundPackages from './OutboundPackages';
import ServiceBoard from './ServiceBoard';

type PackagesSubTab = 'inbound' | 'outbound' | 'service-board';

export default function PackagesTab() {
  const [subTab, setSubTab] = useState<PackagesSubTab>('inbound');

  return (
    <Tabs
      activeKey={subTab}
      onChange={(key) => setSubTab(key as PackagesSubTab)}
      items={[
        { key: 'inbound', label: 'Inbound Packages', children: <InboundPackages /> },
        { key: 'outbound', label: 'Outbound Packages', children: <OutboundPackages /> },
        { key: 'service-board', label: 'Service Board', children: <ServiceBoard /> },
      ]}
    />
  );
}
