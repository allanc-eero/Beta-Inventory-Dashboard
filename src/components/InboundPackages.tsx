'use client';

import { useState } from 'react';
import { usePackagesStore } from '@/store/packagesStore';
import { InboundPackage, InboundPackageStatus, Carrier } from '@/types';
import { Package, Plus, Edit2, CheckCircle, XCircle, Copy, Truck } from 'lucide-react';
import { CARRIER_COLORS, REGIONS } from '@/constants';

const carrierColors = CARRIER_COLORS;

const statusColors: Record<InboundPackageStatus, string> = {
  open: 'bg-green-100 text-green-700 border-green-200',
  received: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const trackingStatusColors: Record<string, string> = {
  DELIVERED: 'bg-green-600 text-white',
  IN_TRANSIT: 'bg-blue-500 text-white',
  OUT_FOR_DELIVERY: 'bg-orange-500 text-white',
  PENDING: 'bg-gray-400 text-white',
};

function generateASN(site: string): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `ASN-${site}-${ts}-${seq}`;
}

export default function InboundPackages() {
  const { inboundPackages, addInboundPackage, receiveInboundPackage, cancelInboundPackage, updateInboundPackage } = usePackagesStore();
  const [filterStatus, setFilterStatus] = useState<InboundPackageStatus | 'all'>('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New ASN form state
  const [newCarrier, setNewCarrier] = useState<Carrier>('DHL');
  const [newTracking, setNewTracking] = useState('');
  const [newModels, setNewModels] = useState('');
  const [newItemsTotal, setNewItemsTotal] = useState(1);
  const [newEta, setNewEta] = useState('');
  const [newDestination, setNewDestination] = useState('USA');
  const [newNotes, setNewNotes] = useState('');

  const filtered = inboundPackages.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterRegion !== 'all' && p.destination !== filterRegion) return false;
    return true;
  });

  const handleCreate = () => {
    const now = new Date().toISOString();
    const pkg: InboundPackage = {
      id: crypto.randomUUID(),
      asn: generateASN(newDestination),
      carrier: newCarrier,
      trackingNumber: newTracking,
      models: newModels,
      itemsTotal: newItemsTotal,
      itemsReceived: 0,
      eta: newEta,
      destination: newDestination,
      status: 'open',
      trackingStatus: 'IN_TRANSIT',
      notes: newNotes || undefined,
      createdAt: now,
      updatedAt: now,
    };
    addInboundPackage(pkg);
    resetForm();
  };

  const handleReceive = (pkgId: string) => {
    receiveInboundPackage(pkgId, 'current_user');
  };

  const resetForm = () => {
    setShowNewForm(false);
    setNewCarrier('DHL');
    setNewTracking('');
    setNewModels('');
    setNewItemsTotal(1);
    setNewEta('');
    setNewDestination('USA');
    setNewNotes('');
  };

  const copyASN = (asn: string) => {
    navigator.clipboard.writeText(asn);
  };

  const getEtaBadge = (eta: string, status: InboundPackageStatus) => {
    if (status !== 'open') return null;
    const now = new Date();
    const etaDate = new Date(eta);
    const diff = Math.ceil((etaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">Overdue</span>;
    if (diff === 0) return <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded font-medium">Today</span>;
    if (diff <= 2) return <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-medium">{diff}d</span>;
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#2c3e7a]" />
            Inbound Packages
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track incoming shipments from creation to receiving. Create an ASN when a shipment is on its way, then receive items as they arrive to add them into inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter pills */}
          {(['open', 'received', 'cancelled', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filterStatus === s
                  ? 'bg-[#2c3e7a] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
          {/* Region filter */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"
          >
            <option value="all">All Regions</option>
            <option value="USA">USA</option>
            <option value="CA">CA</option>
            <option value="EU">EU</option>
            <option value="UK">UK</option>
            <option value="AUS">AUS</option>
            <option value="NZ">NZ</option>
            <option value="JPN">JPN</option>
            <option value="SG">SG</option>
            <option value="Other">Other</option>
          </select>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c3e7a] text-white rounded-lg text-xs font-medium hover:bg-[#1e2f5e] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New ASN
          </button>
        </div>
      </div>

      {/* New ASN Form */}
      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Create New ASN</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Carrier</label>
              <select
                value={newCarrier}
                onChange={(e) => setNewCarrier(e.target.value as Carrier)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="DHL">DHL</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="USPS">USPS</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tracking Number</label>
              <input
                type="text"
                value={newTracking}
                onChange={(e) => setNewTracking(e.target.value)}
                placeholder="e.g., 9630805623"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Models</label>
              <input
                type="text"
                value={newModels}
                onChange={(e) => setNewModels(e.target.value)}
                placeholder="e.g., eero Max 7"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Items</label>
              <input
                type="number"
                min={1}
                value={newItemsTotal}
                onChange={(e) => setNewItemsTotal(parseInt(e.target.value) || 1)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">ETA</label>
              <input
                type="date"
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Destination</label>
              <select
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="USA">USA</option>
                <option value="CA">CA</option>
                <option value="EU">EU</option>
                <option value="UK">UK</option>
                <option value="AUS">AUS</option>
                <option value="NZ">NZ</option>
                <option value="JPN">JPN</option>
                <option value="SG">SG</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Any additional info..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={!newTracking || !newModels || !newEta}
              className="px-4 py-2 bg-[#2c3e7a] text-white rounded-lg text-xs font-medium hover:bg-[#1e2f5e] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create ASN
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ASN #</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">TRACKING</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">MODELS</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ITEMS</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ETA</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">DESTINATION</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">STATUS</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  <Truck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No packages found. Create your first ASN to start tracking.
                </td>
              </tr>
            )}
            {filtered.map((pkg) => (
              <tr key={pkg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{pkg.asn}</span>
                    <button onClick={() => copyASN(pkg.asn)} className="text-gray-400 hover:text-gray-600">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {pkg.trackingStatus && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trackingStatusColors[pkg.trackingStatus] || 'bg-gray-400 text-white'}`}>
                        {pkg.trackingStatus.replace('_', ' ')}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${carrierColors[pkg.carrier]}`}>
                      {pkg.carrier}
                    </span>
                    <span className="text-xs text-gray-700">{pkg.trackingNumber}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{pkg.models}</td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{pkg.itemsReceived} / {pkg.itemsTotal}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-700">{pkg.eta}</span>
                    {getEtaBadge(pkg.eta, pkg.status)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{pkg.destination}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${statusColors[pkg.status]}`}>
                    {pkg.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {pkg.status === 'open' && (
                      <>
                        <button
                          onClick={() => setEditingId(pkg.id)}
                          className="text-xs px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleReceive(pkg.id)}
                          className="text-xs px-2.5 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                        >
                          Receive →
                        </button>
                      </>
                    )}
                    {pkg.status === 'open' && (
                      <button
                        onClick={() => cancelInboundPackage(pkg.id)}
                        className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {pkg.status === 'received' && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Received
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
