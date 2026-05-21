'use client';

import { useMemo, useState } from 'react';
import { useDeviceStore } from '@/store/deviceStore';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Country coordinates for markers
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

type FilterMode = 'all' | 'online' | 'offline' | 'deactivated';

export default function LocationsTab() {
  const { devices } = useDeviceStore();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([20, 20]);

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
    const map = new Map<string, { total: number; online: number; offline: number; deactivated: number }>();
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

  const maxDevices = Math.max(...Array.from(countryData.values()).map((v) => v.total), 1);

  const colorScale = scaleLinear<string>()
    .domain([0, maxDevices / 2, maxDevices])
    .range(['#dbeafe', '#3b82f6', '#1e3a8a']);

  const sizeScale = scaleLinear()
    .domain([0, maxDevices])
    .range([12, 40]);

  // Devices in selected country
  const countryDevices = useMemo(() => {
    if (!selectedCountry) return [];
    return filteredDevices.filter((d) => (d.country || 'Unknown') === selectedCountry);
  }, [filteredDevices, selectedCountry]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Device Map</h2>
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterMode)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Devices</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
            <option value="deactivated">Deactivated</option>
          </select>

          {/* Program filter */}
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Programs</option>
            {programs.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-hidden relative">
        {/* Zoom controls */}
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.5, 20))}
            className="w-8 h-8 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z / 1.5, 1))}
            className="w-8 h-8 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 text-lg font-bold"
          >
            −
          </button>
          <button
            onClick={() => { setZoom(1); setCenter([20, 20]); }}
            className="w-8 h-8 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 text-xs"
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
              {({ geographies }) =>
                geographies.map((geo) => (
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
                ))
              }
            </Geographies>

            {/* Device markers */}
            {Array.from(countryData.entries()).map(([country, data]) => {
              const coords = COUNTRY_COORDS[country];
              if (!coords) return null;
              const size = sizeScale(data.total);
              const color = colorScale(data.total);

              return (
                <Marker
                  key={country}
                  coordinates={coords}
                  onClick={() => setSelectedCountry(country)}
                >
                  <circle
                    r={size / zoom}
                    fill={color}
                    fillOpacity={0.8}
                    stroke="#1e40af"
                    strokeWidth={2 / zoom}
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
                    style={{ fontSize: `${Math.max(11, size * 0.7) / zoom}px`, fill: '#000000', fontWeight: 800 }}
                  >
                    {data.total}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend */}
        <div className="flex items-center justify-between mt-3 px-2">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-200" /> Low density</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-900" /> High density</span>
          </div>
          <p className="text-xs text-gray-400">{filteredDevices.length} devices across {countryData.size} countries</p>
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
                onClick={() => setSelectedCountry(country)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${selectedCountry === country ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{country}</h4>
                  <span className="text-xs text-gray-400">{data.total}</span>
                </div>
                {/* Health bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${onlinePercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="text-green-600">{data.online} online</span>
                  <span>{onlinePercent}% healthy</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Country detail */}
      {selectedCountry && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{selectedCountry} — {countryDevices.length} devices</h3>
            <button onClick={() => setSelectedCountry(null)} className="text-xs text-gray-500 hover:text-gray-700">Close ×</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Serial</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Model</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Program</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {countryDevices.slice(0, 20).map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{d.serialNumber}</td>
                  <td className="px-4 py-2 text-gray-600">{d.model}</td>
                  <td className="px-4 py-2 text-gray-600">{d.assignedTo || d.assignedEmail || '—'}</td>
                  <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{d.program}</span></td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'online' ? 'bg-green-100 text-green-700' : d.status === 'deactivated' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {d.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {countryDevices.length > 20 && (
                <tr><td colSpan={5} className="px-4 py-2 text-xs text-gray-400 text-center">+ {countryDevices.length - 20} more devices</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
