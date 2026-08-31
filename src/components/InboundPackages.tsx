'use client';

import { useState } from 'react';
import { usePackagesStore } from '@/store/packagesStore';
import { InboundPackage, InboundPackageStatus, Carrier } from '@/types';
import { Package, Plus, CheckCircle, XCircle, Copy, Truck } from 'lucide-react';
import { Button, Select, Tag, Card, Input } from '@amzn/eero-web-design-components';
import { CARRIER_COLORS, REGIONS, TagColor } from '@/constants';

const carrierColors = CARRIER_COLORS;

// Inbound status → WDS Tag color (green/periwinkle/red per EDS map).
const statusTagColors: Record<InboundPackageStatus, TagColor> = {
  open: 'green',
  received: 'periwinkle',
  cancelled: 'red',
};

// Carrier tracking milestone → WDS Tag color.
const trackingStatusTagColors: Record<string, TagColor> = {
  DELIVERED: 'green',
  IN_TRANSIT: 'periwinkle',
  OUT_FOR_DELIVERY: 'orange',
  PENDING: 'grey',
};

const carrierOptions = (['DHL', 'FedEx', 'UPS', 'USPS', 'Other'] as const).map((c) => ({ value: c, label: c }));
const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));
const regionFilterOptions = [{ value: 'all', label: 'All Regions' }, ...regionOptions];

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
    if (diff < 0) return <Tag color="red" size="regular">Overdue</Tag>;
    if (diff === 0) return <Tag color="orange" size="regular">Today</Tag>;
    if (diff <= 2) return <Tag color="orange" size="regular">{diff}d</Tag>;
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ui-text-text-primary)] flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--ui-core-periwinkle-periwinkle-6)]" />
            Inbound Packages
          </h2>
          <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">
            Track incoming shipments from creation to receiving. Create an ASN when a shipment is on its way, then receive items as they arrive to add them into inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter pills */}
          {(['open', 'received', 'cancelled', 'all'] as const).map((s) => (
            <Button
              key={s}
              type={filterStatus === s ? 'primary' : 'default'}
              size="medium"
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              onClick={() => setFilterStatus(s)}
            />
          ))}
          {/* Region filter */}
          <div className="w-40">
            <Select
              id="inbound-filter-region"
              value={filterRegion}
              onChange={(val) => setFilterRegion(val as string)}
              options={regionFilterOptions}
            />
          </div>
          <Button
            type="primary"
            size="medium"
            ariaLabel="New ASN"
            onClick={() => setShowNewForm(true)}
            label={
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New ASN
              </span>
            }
          />
        </div>
      </div>

      {/* New ASN Form */}
      {showNewForm && (
        <div className="mb-6">
          <Card size={3} title="Create New ASN">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select
                id="new-carrier"
                label="Carrier"
                layout="vertical"
                value={newCarrier}
                onChange={(val) => setNewCarrier(val as Carrier)}
                options={carrierOptions}
              />
              <Input
                id="new-tracking"
                label="Tracking Number"
                layout="vertical"
                value={newTracking}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTracking(e.target.value)}
                placeholder="e.g., 9630805623"
              />
              <Input
                id="new-models"
                label="Models"
                layout="vertical"
                value={newModels}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewModels(e.target.value)}
                placeholder="e.g., eero Max 7"
              />
              <Input
                id="new-items"
                label="Items"
                layout="vertical"
                type="number"
                min={1}
                value={newItemsTotal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemsTotal(parseInt(e.target.value) || 1)}
              />
              <Input
                id="new-eta"
                label="ETA"
                layout="vertical"
                type="date"
                value={newEta}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEta(e.target.value)}
              />
              <Select
                id="new-destination"
                label="Destination"
                layout="vertical"
                value={newDestination}
                onChange={(val) => setNewDestination(val as string)}
                options={regionOptions}
              />
              <div className="col-span-2">
                <Input
                  id="new-notes"
                  label="Notes (optional)"
                  layout="vertical"
                  value={newNotes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNotes(e.target.value)}
                  placeholder="Any additional info..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button
                type="primary"
                size="medium"
                label="Create ASN"
                disabled={!newTracking || !newModels || !newEta}
                onClick={handleCreate}
              />
              <Button type="default" size="medium" label="Cancel" onClick={resetForm} />
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--ui-background-layer-layer-page)] border border-[var(--ui-background-layer-border-border-layer-page)] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--ui-background-layer-layer-page-hover)] border-b border-[var(--ui-background-layer-border-border-layer-page)]">
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">ASN #</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">TRACKING</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">MODELS</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">ITEMS</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">ETA</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">DESTINATION</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">STATUS</th>
              <th className="text-right text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--ui-text-text-placeholder)]">
                  <Truck className="w-8 h-8 mx-auto mb-2 text-[var(--ui-text-text-disabled)]" />
                  No packages found. Create your first ASN to start tracking.
                </td>
              </tr>
            )}
            {filtered.map((pkg) => (
              <tr key={pkg.id} className="border-b border-[var(--ui-background-layer-border-border-layer-page)] hover:bg-[var(--ui-background-layer-layer-page-hover)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[var(--ui-core-periwinkle-periwinkle-6)] hover:underline cursor-pointer">{pkg.asn}</span>
                    <button onClick={() => copyASN(pkg.asn)} className="text-[var(--ui-text-text-placeholder)] hover:text-[var(--ui-text-text-tertiary)]">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {pkg.trackingStatus && (
                      <Tag color={trackingStatusTagColors[pkg.trackingStatus] || 'grey'} size="regular">
                        {pkg.trackingStatus.replace('_', ' ')}
                      </Tag>
                    )}
                    <Tag color={carrierColors[pkg.carrier]} size="regular">{pkg.carrier}</Tag>
                    <span className="text-xs text-[var(--ui-text-text-secondary)]">{pkg.trackingNumber}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--ui-text-text-secondary)]">{pkg.models}</td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[var(--ui-text-text-secondary)]">{pkg.itemsReceived} / {pkg.itemsTotal}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-[var(--ui-text-text-secondary)]">{pkg.eta}</span>
                    {getEtaBadge(pkg.eta, pkg.status)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--ui-text-text-secondary)]">{pkg.destination}</td>
                <td className="px-4 py-3">
                  <Tag color={statusTagColors[pkg.status]} size="regular" className="capitalize">
                    {pkg.status}
                  </Tag>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {pkg.status === 'open' && (
                      <>
                        <Button type="text" size="medium" label="Edit" onClick={() => setEditingId(pkg.id)} />
                        <Button type="primary" size="medium" label="Receive →" onClick={() => handleReceive(pkg.id)} />
                      </>
                    )}
                    {pkg.status === 'open' && (
                      <Button
                        type="text"
                        size="medium"
                        danger
                        ariaLabel="Cancel package"
                        onClick={() => cancelInboundPackage(pkg.id)}
                        label={<XCircle className="w-3.5 h-3.5" />}
                      />
                    )}
                    {pkg.status === 'received' && (
                      <span className="text-xs text-[var(--ui-core-green-green-6)] flex items-center gap-1">
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
