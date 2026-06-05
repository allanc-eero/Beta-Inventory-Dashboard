'use client';

import { useState } from 'react';
import { usePackagesStore } from '@/store/packagesStore';
import { OutboundPackage, OutboundPackageStatus, Carrier } from '@/types';
import { Send, Plus, CheckCircle, XCircle, Copy, Truck } from 'lucide-react';
import { CARRIER_COLORS, REGIONS } from '@/constants';

const carrierColors = CARRIER_COLORS;

const statusColors: Record<OutboundPackageStatus, string> = {
  open: 'bg-green-100 text-green-700 border-green-200',
  shipped: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-purple-100 text-purple-700 border-purple-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export default function OutboundPackages() {
  const { outboundPackages, addOutboundPackage, shipOutboundPackage, deliverOutboundPackage, cancelOutboundPackage } = usePackagesStore();
  const [filterStatus, setFilterStatus] = useState<OutboundPackageStatus | 'all'>('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showNewForm, setShowNewForm] = useState(false);

  // Form state
  const [newCarrier, setNewCarrier] = useState<Carrier>('FedEx');
  const [newTracking, setNewTracking] = useState('');
  const [newModels, setNewModels] = useState('');
  const [newItemsTotal, setNewItemsTotal] = useState(1);
  const [newRecipient, setNewRecipient] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filtered = outboundPackages.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterRegion !== 'all' && p.destination !== filterRegion) return false;
    return true;
  });

  const handleCreate = () => {
    const now = new Date().toISOString();
    const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    const pkg: OutboundPackage = {
      id: crypto.randomUUID(),
      shippingId: `OUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${seq}`,
      carrier: newCarrier,
      trackingNumber: newTracking,
      models: newModels,
      itemsTotal: newItemsTotal,
      recipient: newRecipient,
      recipientEmail: newRecipientEmail || undefined,
      destination: newDestination,
      status: 'open',
      notes: newNotes || undefined,
      createdAt: now,
      updatedAt: now,
    };
    addOutboundPackage(pkg);
    resetForm();
  };

  const resetForm = () => {
    setShowNewForm(false);
    setNewCarrier('FedEx');
    setNewTracking('');
    setNewModels('');
    setNewItemsTotal(1);
    setNewRecipient('');
    setNewRecipientEmail('');
    setNewDestination('');
    setNewNotes('');
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#2c3e7a]" />
            Outbound Packages
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track packages going out to testers. Mark as shipped when they leave, delivered when confirmed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['open', 'shipped', 'delivered', 'cancelled', 'all'] as const).map((s) => (
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
            New Outbound
          </button>
        </div>
      </div>

      {/* New Outbound Form */}
      {showNewForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Create Outbound Shipment</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Recipient</label>
              <input
                type="text"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Tester name"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Recipient Email</label>
              <input
                type="email"
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
                placeholder="tester@email.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
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
                placeholder="Tracking #"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Models</label>
              <input
                type="text"
                value={newModels}
                onChange={(e) => setNewModels(e.target.value)}
                placeholder="e.g., eero Pro 6E"
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
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Special instructions..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={!newRecipient || !newModels}
              className="px-4 py-2 bg-[#2c3e7a] text-white rounded-lg text-xs font-medium hover:bg-[#1e2f5e] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Outbound
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
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">SHIPPING ID</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">RECIPIENT</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">TRACKING</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">MODELS</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ITEMS</th>
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
                  No outbound packages. Create one to start tracking.
                </td>
              </tr>
            )}
            {filtered.map((pkg) => (
              <tr key={pkg.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{pkg.shippingId}</span>
                    <button onClick={() => copyId(pkg.shippingId)} className="text-gray-400 hover:text-gray-600">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm text-gray-900">{pkg.recipient}</span>
                    {pkg.recipientEmail && (
                      <span className="text-xs text-gray-400 block">{pkg.recipientEmail}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${carrierColors[pkg.carrier]}`}>
                      {pkg.carrier}
                    </span>
                    <span className="text-xs text-gray-700">{pkg.trackingNumber || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{pkg.models}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{pkg.itemsTotal}</td>
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
                          onClick={() => shipOutboundPackage(pkg.id)}
                          className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                        >
                          Mark Shipped
                        </button>
                        <button
                          onClick={() => cancelOutboundPackage(pkg.id)}
                          className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {pkg.status === 'shipped' && (
                      <button
                        onClick={() => deliverOutboundPackage(pkg.id)}
                        className="text-xs px-2.5 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                      >
                        Confirm Delivered
                      </button>
                    )}
                    {pkg.status === 'delivered' && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Delivered
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
