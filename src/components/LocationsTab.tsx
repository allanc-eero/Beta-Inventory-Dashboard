'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device } from '@/types';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { geoCentroid } from 'd3-geo';
import { Select, Tag, Pagination, Button } from '@amzn/eero-web-design-components';
import { downloadCSV } from '@/constants';
import DeviceDetailPanel from './DeviceDetailPanel';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Hand-tuned marker positions (override the computed centroid for a nicer dot —
// e.g. the US centroid is dragged NW by Alaska, and tiny states like Singapore
// aren't in the 110m atlas at all). Anything NOT listed here falls back to the
// centroid computed from the world-atlas geography (see `centroids` below), so
// any country present in device data still gets a marker.
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'Australia': [134, -25],
  'Italy': [12.5, 42],
  'Spain': [-3.7, 40.4],
  'Germany': [10.4, 51.2],
  'United Kingdom': [-1.5, 53],
  'UK': [-1.5, 53],
  'France': [2.2, 46.6],
  'Ireland': [-7.7, 53.4],
  'Netherlands': [5.3, 52.1],
  'United States': [-98, 39],
  'US': [-98, 39],
  'USA': [-98, 39],
  'Canada': [-106, 56],
  'Japan': [138, 36],
  'India': [78, 21],
  'Brazil': [-51, -14],
  'Singapore': [103.8, 1.3],
  'New Zealand': [174, -41],
};

// Reconcile common device-side country names with the world-atlas `properties.name`
// canonical spelling (keys + values lowercased). Extend as new naming variants appear.
const COUNTRY_ALIASES: Record<string, string> = {
  'united states': 'united states of america',
  'usa': 'united states of america',
  'us': 'united states of america',
  'u.s.': 'united states of america',
  'u.s.a.': 'united states of america',
  'uk': 'united kingdom',
  'u.k.': 'united kingdom',
  'great britain': 'united kingdom',
  'south korea': 'south korea',
  'republic of korea': 'south korea',
  'north korea': 'north korea',
  'russia': 'russia',
  'russian federation': 'russia',
  'czech republic': 'czechia',
  'uae': 'united arab emirates',
};

// Normalize a country name to the key used in the centroid lookup.
function normalizeCountry(name: string): string {
  const key = name.trim().toLowerCase();
  return COUNTRY_ALIASES[key] ?? key;
}

type FilterMode = 'all' | 'online' | 'offline' | 'deactivated';
type DetailStatus = 'all' | 'online' | 'not_online' | 'deactivated';

interface RegionData { total: number; online: number; offline: number; deactivated: number }

// Small live stat tile for the KPI strip.
function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-3">
      <p className="text-xs text-[var(--ui-text-text-tertiary)]">{label}</p>
      <p className="text-xl font-bold" style={{ color: accent || 'var(--ui-text-text-primary)' }}>{value}</p>
    </div>
  );
}

export default function LocationsTab() {
  const { devices, syncMetadata } = useDeviceStore();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([20, 20]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailStatus, setDetailStatus] = useState<DetailStatus>('all');
  const [openDevice, setOpenDevice] = useState<Device | null>(null);
  // Centroids computed once from the loaded world-atlas geographies, keyed by
  // normalized country name. Used as the fallback marker position for any region
  // not in the hand-tuned COUNTRY_COORDS table.
  const [centroids, setCentroids] = useState<Record<string, [number, number]>>({});

  const programs = useMemo(() => {
    return Array.from(new Set(devices.map((d) => d.program).filter(Boolean)));
  }, [devices]);

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (filter === 'online' && d.status !== 'online') return false;
      if (filter === 'offline' && d.status !== 'not_online') return false;
      if (filter === 'deactivated' && d.status !== 'deactivated') return false;
      if (programFilter !== 'all' && d.program !== programFilter) return false;
      return true;
    });
  }, [devices, filter, programFilter]);

  // Group by country
  const countryData = useMemo(() => {
    const map = new Map<string, RegionData>();
    filteredDevices.forEach((d) => {
      const country = d.country || 'Unknown';
      if (!map.has(country)) map.set(country, { total: 0, online: 0, offline: 0, deactivated: 0 });
      const entry = map.get(country)!;
      entry.total++;
      if (d.status === 'online') entry.online++;
      else if (d.status === 'deactivated') entry.deactivated++;
      else entry.offline++;
    });
    return map;
  }, [filteredDevices]);

  // Live totals across the current filter — updates as devices are uploaded / come online.
  const totals = useMemo(() => {
    let online = 0, offline = 0, deactivated = 0;
    filteredDevices.forEach((d) => {
      if (d.status === 'online') online++;
      else if (d.status === 'deactivated') deactivated++;
      else offline++;
    });
    const total = filteredDevices.length;
    return { total, online, offline, deactivated, rate: total ? Math.round((online / total) * 100) : 0 };
  }, [filteredDevices]);

  // Regions present in the data that we can't place on the map (no override and
  // not in the atlas — e.g. "Unknown" or micro-states). Surfaced in the legend.
  const unmappedRegions = useMemo(
    () => Array.from(countryData.keys()).filter((c) => !(COUNTRY_COORDS[c] ?? centroids[normalizeCountry(c)])),
    [countryData, centroids],
  );

  const maxDevices = Math.max(...Array.from(countryData.values()).map((v) => v.total), 1);

  const colorScale = scaleLinear<string>()
    .domain([0, maxDevices / 2, maxDevices])
    // d3 color ramp — hexes map to periwinkle-2/5/9; kept as raw hex because d3 interpolates them
    .range(['#dbeafe', '#3b82f6', '#1e3a8a']);

  const sizeScale = scaleLinear()
    .domain([0, maxDevices])
    .range([12, 40]);

  // Resolve a marker position: hand-tuned override first, then the atlas centroid.
  const resolveCoords = (country: string): [number, number] | undefined =>
    COUNTRY_COORDS[country] ?? centroids[normalizeCountry(country)];

  // Fly the map to a region (used when a marker or region container is clicked).
  const flyTo = (country: string) => {
    const coords = resolveCoords(country);
    if (coords) { setCenter(coords); setZoom((z) => Math.max(z, 4)); }
  };
  const selectRegion = (country: string) => { setSelectedCountry(country); flyTo(country); };

  // Devices in selected country (respects the top-level filter), then the in-panel status chip.
  const countryDevices = useMemo(() => {
    if (!selectedCountry) return [];
    return filteredDevices.filter((d) => (d.country || 'Unknown') === selectedCountry);
  }, [filteredDevices, selectedCountry]);

  const detailDevices = useMemo(() => {
    if (detailStatus === 'all') return countryDevices;
    return countryDevices.filter((d) => d.status === detailStatus);
  }, [countryDevices, detailStatus]);

  const detailCounts = useMemo(() => {
    let online = 0, notOnline = 0, deactivated = 0;
    countryDevices.forEach((d) => {
      if (d.status === 'online') online++;
      else if (d.status === 'deactivated') deactivated++;
      else notOnline++;
    });
    return { online, notOnline, deactivated };
  }, [countryDevices]);

  // Reset pagination when the selection or in-panel filter changes.
  useEffect(() => { setPage(1); setDetailStatus('all'); }, [selectedCountry]);
  useEffect(() => { setPage(1); }, [detailStatus]);
  const countryTotalPages = Math.max(1, Math.ceil(detailDevices.length / pageSize));
  const countryPage = Math.min(page, countryTotalPages);
  const pagedCountryDevices = detailDevices.slice((countryPage - 1) * pageSize, (countryPage - 1) * pageSize + pageSize);

  const lastSync = syncMetadata?.lastFullSync ? new Date(syncMetadata.lastFullSync).toLocaleString() : 'never';

  const exportRegionCSV = () => {
    if (!selectedCountry) return;
    const rows: (string | number)[][] = [['Serial', 'Model', 'Assigned To', 'Email', 'Program', 'Status', 'Country']];
    detailDevices.forEach((d) => rows.push([
      d.serialNumber, d.model, d.assignedTo || '', d.assignedEmail || '', d.program, d.status.replace(/_/g, ' '), d.country || '',
    ]));
    downloadCSV(`${selectedCountry.replace(/\s+/g, '_')}_devices.csv`, rows);
  };

  const DETAIL_CHIPS: { value: DetailStatus; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: countryDevices.length },
    { value: 'online', label: 'Online', count: detailCounts.online },
    { value: 'not_online', label: 'Not online', count: detailCounts.notOnline },
    { value: 'deactivated', label: 'Deactivated', count: detailCounts.deactivated },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--ui-text-text-primary)]">Device Map</h2>
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="w-40">
            <Select
              id="locations-status-filter"
              ariaLabel="Filter by status"
              value={filter}
              onChange={(val) => setFilter(val as FilterMode)}
              options={[
                { value: 'all', label: 'All Devices' },
                { value: 'online', label: 'Online Only' },
                { value: 'offline', label: 'Offline Only' },
                { value: 'deactivated', label: 'Deactivated' },
              ]}
            />
          </div>

          {/* Program filter */}
          <div className="w-40">
            <Select
              id="locations-program-filter"
              ariaLabel="Filter by program"
              value={programFilter}
              onChange={(val) => setProgramFilter(val as string)}
              options={[
                { value: 'all', label: 'All Programs' },
                ...programs.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Live KPI strip — reflects uploads and online syncs as they happen */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="Regions" value={countryData.size} />
        <StatTile label="Devices" value={totals.total} />
        <StatTile label="Online" value={totals.online} accent="var(--ui-core-green-green-6)" />
        <StatTile label="Not online" value={totals.offline} accent="var(--ui-core-orange-orange-5)" />
        <StatTile label="Deactivated" value={totals.deactivated} accent="var(--ui-text-text-tertiary)" />
        <StatTile label="Online rate" value={`${totals.rate}%`} accent={totals.rate >= 70 ? 'var(--ui-core-green-green-6)' : 'var(--ui-core-orange-orange-5)'} />
      </div>

      {/* Map */}
      <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] p-4 overflow-hidden relative">
        {/* Zoom controls (plain icon-only map controls — token-mapped colors only) */}
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.5, 20))}
            className="w-8 h-8 bg-[var(--ui-background-layer-layer-page)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg shadow-sm flex items-center justify-center text-[var(--ui-text-text-secondary)] hover:bg-[var(--ui-background-layer-layer-page-hover)] text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
            className="w-8 h-8 bg-[var(--ui-background-layer-layer-page)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg shadow-sm flex items-center justify-center text-[var(--ui-text-text-secondary)] hover:bg-[var(--ui-background-layer-layer-page-hover)] text-lg font-bold"
          >
            −
          </button>
          <button
            onClick={() => { setZoom(1); setCenter([20, 20]); }}
            className="w-8 h-8 bg-[var(--ui-background-layer-layer-page)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-lg shadow-sm flex items-center justify-center text-[var(--ui-text-text-secondary)] hover:bg-[var(--ui-background-layer-layer-page-hover)] text-xs"
          >
            ⟲
          </button>
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120 }}
          style={{ width: '100%', height: '400px' }}
        >
          <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z); }} minZoom={1} maxZoom={20}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) => {
                // Compute a centroid for every country once, so regions absent from
                // the hand-tuned table still get a marker. Deferred out of render.
                if (geographies.length && Object.keys(centroids).length === 0) {
                  const next: Record<string, [number, number]> = {};
                  geographies.forEach((geo) => {
                    const name = geo.properties?.name;
                    if (!name) return;
                    try {
                      const c = geoCentroid(geo);
                      if (Number.isFinite(c[0]) && Number.isFinite(c[1])) next[normalizeCountry(name)] = [c[0], c[1]];
                    } catch { /* skip un-centroid-able geometries */ }
                  });
                  queueMicrotask(() => setCentroids(next));
                }
                return geographies.map((geo) => (
                  <Geography
                    key={geo.rpiKey || geo.properties.name}
                    geography={geo}
                    fill="#f1f5f9"
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#e2e8f0', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ));
              }}
            </Geographies>

            {/* Device markers — center shows online/total so coming-online is visible on the map */}
            {Array.from(countryData.entries()).map(([country, data]) => {
              const coords = resolveCoords(country);
              if (!coords) return null;
              const size = sizeScale(data.total);
              const color = colorScale(data.total);
              const isSelected = selectedCountry === country;
              const centerLabel = filter === 'all' ? `${data.online}/${data.total}` : `${data.total}`;

              return (
                <Marker
                  key={country}
                  coordinates={coords}
                  onClick={() => selectRegion(country)}
                >
                  <circle
                    r={size / zoom}
                    fill={color}
                    fillOpacity={0.8}
                    stroke={isSelected ? '#16a34a' : '#1e40af'}
                    strokeWidth={(isSelected ? 3.5 : 2) / zoom}
                    style={{ cursor: 'pointer' }}
                  />
                  <text
                    textAnchor="middle"
                    y={(size / zoom) + (16 / zoom)}
                    style={{ fontSize: `${12 / zoom}px`, fill: '#000000', fontWeight: 700 }}
                  >
                    {country}
                  </text>
                  <text
                    textAnchor="middle"
                    y={4 / zoom}
                    style={{ fontSize: `${Math.max(11, size * 0.55) / zoom}px`, fill: '#000000', fontWeight: 800 }}
                  >
                    {centerLabel}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend */}
        <div className="flex items-center justify-between mt-3 px-2">
          <div className="flex items-center gap-4 text-xs text-[var(--ui-text-text-tertiary)]">
            {/* swatches mirror the d3 colorScale ramp (periwinkle-2/5/9) */}
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--ui-core-periwinkle-periwinkle-2)]" /> Low density</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--ui-core-periwinkle-periwinkle-5)]" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--ui-core-periwinkle-periwinkle-9)]" /> High density</span>
            {filter === 'all' && <span className="text-[var(--ui-text-text-placeholder)]">· marker shows online/total</span>}
          </div>
          <p className="text-xs text-[var(--ui-text-text-placeholder)]">
            {filteredDevices.length} devices across {countryData.size} countries · synced {lastSync}
            {unmappedRegions.length > 0 && ` · ${unmappedRegions.length} not mappable`}
          </p>
        </div>
      </div>

      {/* Regional stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from(countryData.entries())
          .sort((a, b) => b[1].total - a[1].total)
          .map(([country, data]) => {
            const onlinePercent = data.total > 0 ? Math.round((data.online / data.total) * 100) : 0;
            return (
              <div
                key={country}
                onClick={() => selectRegion(country)}
                className={`bg-[var(--ui-background-layer-layer-page)] rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${selectedCountry === country ? 'border-[var(--ui-core-periwinkle-periwinkle-5)] ring-1 ring-[var(--ui-core-periwinkle-periwinkle-2)]' : 'border-[var(--ui-background-layer-border-border-layer-page)]'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[var(--ui-text-text-primary)]">{country}</h4>
                  <span className="text-xs text-[var(--ui-text-text-placeholder)]">{data.total}</span>
                </div>
                {/* Health bar */}
                <div className="w-full h-2 bg-[var(--ui-background-layer-layer-page-hover)] rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-[var(--ui-core-green-green-6)] rounded-full" style={{ width: `${onlinePercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--ui-text-text-tertiary)]">
                  <span className="flex items-center gap-2">
                    <span className="text-[var(--ui-core-green-green-6)]">{data.online} online</span>
                    {data.offline > 0 && <span className="text-[var(--ui-core-orange-orange-5)]">{data.offline} not online</span>}
                    {data.deactivated > 0 && <span>{data.deactivated} deact.</span>}
                  </span>
                  <span>{onlinePercent}% healthy</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Country detail */}
      {selectedCountry && (
        <div className="bg-[var(--ui-background-layer-layer-page)] rounded-xl border border-[var(--ui-background-layer-border-border-layer-page)] overflow-hidden">
          <div className="p-4 border-b border-[var(--ui-background-layer-border-border-layer-page)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--ui-text-text-primary)]">{selectedCountry} — {countryDevices.length} devices</h3>
              <div className="flex items-center gap-3">
                <Button type="text" label="Export CSV" onClick={exportRegionCSV} />
                <button onClick={() => setSelectedCountry(null)} className="text-xs text-[var(--ui-text-text-tertiary)] hover:text-[var(--ui-text-text-secondary)]">Close ×</button>
              </div>
            </div>
            {/* Status filter chips */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {DETAIL_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setDetailStatus(chip.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${detailStatus === chip.value
                    ? 'bg-[var(--ui-core-periwinkle-periwinkle-1)] border-[var(--ui-core-periwinkle-periwinkle-5)] text-[var(--ui-core-periwinkle-periwinkle-7)]'
                    : 'bg-[var(--ui-background-layer-layer-page)] border-[var(--ui-background-layer-border-border-layer-page)] text-[var(--ui-text-text-tertiary)] hover:bg-[var(--ui-background-layer-layer-page-hover)]'}`}
                >
                  {chip.label} · {chip.count}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--ui-background-layer-layer-page-hover)]">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Serial</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Model</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Assigned To</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Program</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--ui-text-text-tertiary)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-background-layer-border-border-layer-page)]">
              {pagedCountryDevices.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setOpenDevice(d)}
                  className="hover:bg-[var(--ui-background-layer-layer-page-hover)] cursor-pointer"
                >
                  <td className="px-4 py-2 font-mono text-xs text-[var(--ui-core-periwinkle-periwinkle-6)]">{d.serialNumber}</td>
                  <td className="px-4 py-2 text-[var(--ui-text-text-tertiary)]">{d.model}</td>
                  <td className="px-4 py-2 text-[var(--ui-text-text-tertiary)]">{d.assignedTo || d.assignedEmail || '—'}</td>
                  <td className="px-4 py-2"><Tag color="periwinkle" size="regular">{d.program}</Tag></td>
                  <td className="px-4 py-2">
                    <Tag color={d.status === 'online' ? 'green' : d.status === 'deactivated' ? 'grey' : 'orange'} size="regular">
                      {d.status.replace(/_/g, ' ')}
                    </Tag>
                  </td>
                </tr>
              ))}
              {pagedCountryDevices.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[var(--ui-text-text-placeholder)]">No devices match this filter.</td></tr>
              )}
            </tbody>
          </table>
          {detailDevices.length > pageSize && (
            <div className="border-t border-[var(--ui-background-layer-border-border-layer-page)] px-4 py-2">
              <Pagination
                pagination={{ totalItems: detailDevices.length, totalPages: countryTotalPages, hasPreviousPage: countryPage > 1, hasNextPage: countryPage < countryTotalPages }}
                currentPage={countryPage}
                pageSize={pageSize}
                onPageChange={setPage}
                onNextPage={() => setPage((n) => Math.min(countryTotalPages, n + 1))}
                onPreviousPage={() => setPage((n) => Math.max(1, n - 1))}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                pageSizeOptions={[{ value: 10, label: '10' }, { value: 25, label: '25' }, { value: 50, label: '50' }]}
                ln10_label={{ prevBtn: 'Previous', nextBtn: 'Next', pageBtn: 'Page', itemsPerPage: 'Per page', counter: (s, e, t) => `Showing ${s}–${e} of ${t}` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Shared editable device panel — same one used in Devices / People / Surveys */}
      {openDevice && (
        <DeviceDetailPanel device={openDevice} onClose={() => setOpenDevice(null)} />
      )}
    </div>
  );
}
