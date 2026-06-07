'use client';

export default function OverviewDashboard() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', backgroundColor: '#f9fafb' }}>

      {/* ROW 1: Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', margin: 0 }}>Total Devices</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0' }}>1,034</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>In Stock</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: '4px 0 0 0' }}>428</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>Checked Out</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: '4px 0 0 0' }}>390</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>On Hold</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: '4px 0 0 0' }}>0</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>Inactive</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: '4px 0 0 0' }}>216</p>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: 0 }}>Disposal</p>
          <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: '4px 0 0 0' }}>0</p>
        </div>
      </div>

      {/* ROW 2: Three Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* STATUS BREAKDOWN */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#374151', margin: '0 0 16px 0' }}>Status Breakdown</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="52" fill="none" stroke="#3b82f6" strokeWidth="24" strokeDasharray="124 203" strokeDashoffset="0" />
              <circle cx="70" cy="70" r="52" fill="none" stroke="#6b7280" strokeWidth="24" strokeDasharray="69 258" strokeDashoffset="-124" />
              <circle cx="70" cy="70" r="52" fill="none" stroke="#10b981" strokeWidth="24" strokeDasharray="134 193" strokeDashoffset="-193" />
            </svg>
            <div style={{ position: 'absolute', width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>1,034</span>
              <span style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Total</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '2px', display: 'inline-block' }} /><span>checked out</span><b>390</b><span style={{ color: '#9ca3af' }}>38%</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#6b7280', borderRadius: '2px', display: 'inline-block' }} /><span>inactive</span><b>216</b><span style={{ color: '#9ca3af' }}>21%</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }} /><span>in stock</span><b>428</b><span style={{ color: '#9ca3af' }}>41%</span></div>
            </div>
          </div>
        </div>

        {/* TOP LOCATIONS */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#374151', margin: '0 0 16px 0' }}>Top Locations</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="44" fill="none" stroke="#2563eb" strokeWidth="20" strokeDasharray="63 213" strokeDashoffset="0" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#059669" strokeWidth="20" strokeDasharray="52 224" strokeDashoffset="-63" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#d97706" strokeWidth="20" strokeDasharray="44 232" strokeDashoffset="-115" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#7c3aed" strokeWidth="20" strokeDasharray="25 251" strokeDashoffset="-159" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#dc2626" strokeWidth="20" strokeDasharray="25 251" strokeDashoffset="-184" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#ec4899" strokeWidth="20" strokeDasharray="17 259" strokeDashoffset="-209" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>10</span>
                <span style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase' }}>Locations</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              {[
                { color: '#2563eb', name: 'SFO38-3', count: 212, pct: '23%' },
                { color: '#059669', name: 'SFO38', count: 180, pct: '19%' },
                { color: '#d97706', name: 'SFO38-3-GATEWA...', count: 148, pct: '16%' },
                { color: '#7c3aed', name: 'SFO38-4-BALONEY-D1', count: 82, pct: '9%' },
                { color: '#dc2626', name: 'SFO125', count: 79, pct: '9%' },
                { color: '#ec4899', name: 'ZZZ', count: 60, pct: '6%' },
                { color: '#0891b2', name: 'TPE16', count: 53, pct: '6%' },
                { color: '#65a30d', name: 'SFO38-4-BALONEY-C1', count: 42, pct: '5%' },
                { color: '#e11d48', name: 'ZZ7-REMOTE', count: 36, pct: '4%' },
                { color: '#f97316', name: 'ZZZ-BRAZIL', count: 33, pct: '4%' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: item.color, borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: '#374151' }}>{item.name}</span>
                  <b>{item.count}</b>
                  <span style={{ color: '#9ca3af' }}>{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP MODELS */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#374151', margin: '0 0 16px 0' }}>Top Models</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="44" fill="none" stroke="#1e3a5f" strokeWidth="20" strokeDasharray="47 229" strokeDashoffset="0" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#d97706" strokeWidth="20" strokeDasharray="44 232" strokeDashoffset="-47" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#059669" strokeWidth="20" strokeDasharray="37 239" strokeDashoffset="-91" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#dc2626" strokeWidth="20" strokeDasharray="37 239" strokeDashoffset="-128" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#7c3aed" strokeWidth="20" strokeDasharray="30 246" strokeDashoffset="-165" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#0891b2" strokeWidth="20" strokeDasharray="27 249" strokeDashoffset="-195" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>10</span>
                <span style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase' }}>Models</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              {[
                { color: '#1e3a5f', name: 'Merci', count: 64, pct: '17%' },
                { color: '#d97706', name: 'Patria', count: 58, pct: '16%' },
                { color: '#059669', name: 'Retrograde_4U', count: 50, pct: '13%' },
                { color: '#dc2626', name: 'FireflyExtender', count: 50, pct: '13%' },
                { color: '#7c3aed', name: 'Foghorn', count: 41, pct: '11%' },
                { color: '#0891b2', name: 'Novo', count: 37, pct: '10%' },
                { color: '#65a30d', name: 'Jupiter', count: 32, pct: '9%' },
                { color: '#ec4899', name: 'FireflyALC', count: 28, pct: '7%' },
                { color: '#e11d48', name: 'AndytownGateway', count: 8, pct: '2%' },
                { color: '#f97316', name: 'XeniaPoe', count: 6, pct: '2%' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: item.color, borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: '#374151' }}>{item.name}</span>
                  <b>{item.count}</b>
                  <span style={{ color: '#9ca3af' }}>{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#3b82f6', textAlign: 'right', marginTop: '8px', cursor: 'pointer' }}>View all →</p>
        </div>
      </div>

      {/* ROW 3: Service Orders */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>Service Orders</span>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>31 total</span>
        </div>

        {/* Segmented bar */}
        <div style={{ display: 'flex', height: '28px', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
          <div style={{ width: '45%', backgroundColor: '#3b82f6' }} />
          <div style={{ width: '12%', backgroundColor: '#b45309' }} />
          <div style={{ width: '20%', backgroundColor: '#16a34a' }} />
          <div style={{ width: '2%', backgroundColor: '#6b7280' }} />
          <div style={{ width: '14%', backgroundColor: '#bbf7d0' }} />
          <div style={{ width: '7%', backgroundColor: '#991b1b' }} />
        </div>

        {/* Numbers above */}
        <div style={{ display: 'flex', marginBottom: '24px' }}>
          <div style={{ width: '45%' }}><span style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb' }}>22</span><br /><span style={{ fontSize: '11px', color: '#6b7280' }}>Open</span></div>
          <div style={{ width: '12%' }}><span style={{ fontSize: '14px', fontWeight: 700 }}>6</span><br /><span style={{ fontSize: '11px', color: '#6b7280' }}>In progress</span></div>
          <div style={{ width: '20%' }}><span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>10</span><br /><span style={{ fontSize: '11px', color: '#6b7280' }}>Complete</span></div>
          <div style={{ width: '2%' }}><span style={{ fontSize: '12px' }}>1</span><br /><span style={{ fontSize: '10px', color: '#6b7280' }}>On hold</span></div>
          <div style={{ width: '14%', textAlign: 'center' }}><span style={{ fontSize: '12px' }}>7</span><br /><span style={{ fontSize: '10px', color: '#6b7280' }}>Closed 30d</span></div>
          <div style={{ width: '7%', textAlign: 'center' }}><span style={{ fontSize: '12px' }}>2</span><br /><span style={{ fontSize: '10px', color: '#6b7280' }}>Cancelled</span></div>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
          {/* LEFT */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>By Job Type</p>
            {[
              { letter: 'R', label: 'Repair', width: '80%', color: '#dc2626' },
              { letter: 'N', label: 'New Testbed', width: '65%', color: '#16a34a' },
              { letter: 'S', label: 'Swap', width: '40%', color: '#7c3aed' },
              { letter: 'P', label: 'Procurement / Device Request', width: '30%', color: '#1d4ed8' },
              { letter: 'T', label: 'Outbound Shipment', width: '15%', color: '#1e3a5f' },
              { letter: 'O', label: 'Other', width: '5%', color: '#374151' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, width: '14px' }}>{item.letter}</span>
                <span style={{ fontSize: '13px', color: '#4b5563', width: '160px', flexShrink: 0 }}>· {item.label}</span>
                <div style={{ flex: 1, height: '14px', backgroundColor: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: item.width, backgroundColor: item.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}

            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginTop: '24px', marginBottom: '8px' }}>Top Assignees (Open)</p>
            <p style={{ fontSize: '13px', color: '#4b5563' }}>sidney@eero.com</p>
          </div>

          {/* RIGHT */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>By Priority (Open)</p>
            {[
              { count: 10, label: 'P0 — Emergency / Blocking', width: '100%', color: '#dc2626', right: 9 },
              { count: 3, label: 'P1 — Critical', width: '55%', color: '#ea580c', right: 7 },
              { count: 10, label: 'P2 — Corrective', width: '100%', color: '#ca8a04', right: 6 },
              { count: 4, label: 'P3 — Routine', width: '40%', color: '#16a34a', right: 5 },
              { count: 3, label: 'P4 — Low / Backlog', width: '30%', color: '#3b82f6', right: 22 },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, width: '20px', textAlign: 'right' }}>{item.count}</span>
                <span style={{ fontSize: '12px', color: '#4b5563', width: '160px', flexShrink: 0 }}>{item.label}</span>
                <div style={{ flex: 1, height: '12px', backgroundColor: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: item.width, backgroundColor: item.color, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, width: '20px', textAlign: 'right' }}>{item.right}</span>
              </div>
            ))}

            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginTop: '24px', marginBottom: '8px' }}>By Site (Open)</p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>22</span>
              <span style={{ color: '#4b5563' }}>SFO38</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
