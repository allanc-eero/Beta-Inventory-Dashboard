'use client';

import { useState } from 'react';
import { usePackagesStore } from '@/store/packagesStore';
import { OutboundPackage, OutboundPackageStatus, Carrier } from '@/types';
import { Send, Plus, CheckCircle, XCircle, Copy, Truck } from 'lucide-react';
import { Button, Select, Tag, Card, Input } from '@amzn/eero-web-design-components';
import { CARRIER_COLORS, REGIONS, TagColor } from '@/constants';

const carrierColors = CARRIER_COLORS;

// Outbound status → WDS Tag color (green/periwinkle/purple/red per EDS map).
const statusTagColors: Record<OutboundPackageStatus, TagColor> = {
  open: 'green',
  shipped: 'periwinkle',
  delivered: 'purple',
  cancelled: 'red',
};

const carrierOptions = (['DHL', 'FedEx', 'UPS', 'USPS', 'Other'] as const).map((c) => ({ value: c, label: c }));
const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));
const regionFilterOptions = [{ value: 'all', label: 'All Regions' }, ...regionOptions];

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
          <h2 className="text-xl font-semibold text-[var(--ui-text-text-primary)] flex items-center gap-2">
            <Send className="w-5 h-5 text-[var(--ui-core-periwinkle-periwinkle-6)]" />
            Outbound Packages
          </h2>
          <p className="text-sm text-[var(--ui-text-text-tertiary)] mt-1">
            Track packages going out to testers. Mark as shipped when they leave, delivered when confirmed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['open', 'shipped', 'delivered', 'cancelled', 'all'] as const).map((s) => (
            <Button
              key={s}
              type={filterStatus === s ? 'primary' : 'default'}
              size="medium"
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              onClick={() => setFilterStatus(s)}
            />
          ))}
          <div className="w-40">
            <Select
              id="outbound-filter-region"
              value={filterRegion}
              onChange={(val) => setFilterRegion(val as string)}
              options={regionFilterOptions}
            />
          </div>
          <Button
            type="primary"
            size="medium"
            ariaLabel="New Outbound"
            onClick={() => setShowNewForm(true)}
            label={
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Outbound
              </span>
            }
          />
        </div>
      </div>

      {/* New Outbound Form */}
      {showNewForm && (
        <div className="mb-6">
          <Card size={3} title="Create Outbound Shipment">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                id="out-recipient"
                label="Recipient"
                layout="vertical"
                value={newRecipient}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRecipient(e.target.value)}
                placeholder="Tester name"
              />
              <Input
                id="out-recipient-email"
                label="Recipient Email"
                layout="vertical"
                type="email"
                value={newRecipientEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRecipientEmail(e.target.value)}
                placeholder="tester@email.com"
              />
              <Select
                id="out-carrier"
                label="Carrier"
                layout="vertical"
                value={newCarrier}
                onChange={(val) => setNewCarrier(val as Carrier)}
                options={carrierOptions}
              />
              <Input
                id="out-tracking"
                label="Tracking Number"
                layout="vertical"
                value={newTracking}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTracking(e.target.value)}
                placeholder="Tracking #"
              />
              <Input
                id="out-models"
                label="Models"
                layout="vertical"
                value={newModels}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewModels(e.target.value)}
                placeholder="e.g., eero Pro 6E"
              />
              <Input
                id="out-items"
                label="Items"
                layout="vertical"
                type="number"
                min={1}
                value={newItemsTotal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemsTotal(parseInt(e.target.value) || 1)}
              />
              <Select
                id="out-destination"
                label="Destination"
                layout="vertical"
                value={newDestination}
                onChange={(val) => setNewDestination(val as string)}
                options={regionOptions}
              />
              <Input
                id="out-notes"
                label="Notes (optional)"
                layout="vertical"
                value={newNotes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNotes(e.target.value)}
                placeholder="Special instructions..."
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button
                type="primary"
                size="medium"
                label="Create Outbound"
                disabled={!newRecipient || !newModels}
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
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">SHIPPING ID</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">RECIPIENT</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">TRACKING</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">MODELS</th>
              <th className="text-left text-xs font-medium text-[var(--ui-text-text-tertiary)] px-4 py-3">ITEMS</th>
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
                  No outbound packages. Create one to start tracking.
                </td>
              </tr>
            )}
            {filtered.map((pkg) => (
              <tr key={pkg.id} className="border-b border-[var(--ui-background-layer-border-border-layer-page)] hover:bg-[var(--ui-background-layer-layer-page-hover)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[var(--ui-core-periwinkle-periwinkle-6)] hover:underline cursor-pointer">{pkg.shippingId}</span>
                    <button onClick={() => copyId(pkg.shippingId)} className="text-[var(--ui-text-text-placeholder)] hover:text-[var(--ui-text-text-tertiary)]">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm text-[var(--ui-text-text-primary)]">{pkg.recipient}</span>
                    {pkg.recipientEmail && (
                      <span className="text-xs text-[var(--ui-text-text-placeholder)] block">{pkg.recipientEmail}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag color={carrierColors[pkg.carrier]} size="regular">{pkg.carrier}</Tag>
                    <span className="text-xs text-[var(--ui-text-text-secondary)]">{pkg.trackingNumber || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--ui-text-text-secondary)]">{pkg.models}</td>
                <td className="px-4 py-3 text-sm text-[var(--ui-text-text-secondary)]">{pkg.itemsTotal}</td>
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
                        <Button type="primary" size="medium" label="Mark Shipped" onClick={() => shipOutboundPackage(pkg.id)} />
                        <Button
                          type="text"
                          size="medium"
                          danger
                          ariaLabel="Cancel package"
                          onClick={() => cancelOutboundPackage(pkg.id)}
                          label={<XCircle className="w-3.5 h-3.5" />}
                        />
                      </>
                    )}
                    {pkg.status === 'shipped' && (
                      <Button type="primary" size="medium" label="Confirm Delivered" onClick={() => deliverOutboundPackage(pkg.id)} />
                    )}
                    {pkg.status === 'delivered' && (
                      <span className="text-xs text-[var(--ui-core-green-green-6)] flex items-center gap-1">
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
