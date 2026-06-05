'use client';

import { useState } from 'react';
import InboundPackages from './InboundPackages';
import OutboundPackages from './OutboundPackages';
import ServiceBoard from './ServiceBoard';

type PackagesSubTab = 'inbound' | 'outbound' | 'service-board';

export default function PackagesTab() {
  const [subTab, setSubTab] = useState<PackagesSubTab>('inbound');

  return (
    <div>
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200 pb-3">
        {[
          { id: 'inbound' as PackagesSubTab, label: 'Inbound Packages' },
          { id: 'outbound' as PackagesSubTab, label: 'Outbound Packages' },
          { id: 'service-board' as PackagesSubTab, label: 'Service Board' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              subTab === tab.id
                ? 'bg-[#2c3e7a] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === 'inbound' && <InboundPackages />}
      {subTab === 'outbound' && <OutboundPackages />}
      {subTab === 'service-board' && <ServiceBoard />}
    </div>
  );
}
