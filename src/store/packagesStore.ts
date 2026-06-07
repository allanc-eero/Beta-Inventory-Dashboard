'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  InboundPackage,
  OutboundPackage,
  ServiceOrder,
  InboundPackageStatus,
  OutboundPackageStatus,
  ServiceOrderStatus,
  ShapeshiftJob,
  ShapeshiftJobStatus,
} from '@/types';

interface PackagesStore {
  inboundPackages: InboundPackage[];
  outboundPackages: OutboundPackage[];
  serviceOrders: ServiceOrder[];

  // Inbound actions
  addInboundPackage: (pkg: InboundPackage) => void;
  updateInboundPackage: (id: string, updates: Partial<InboundPackage>) => void;
  receiveInboundPackage: (id: string, receivedBy: string, itemsReceived?: number) => void;
  cancelInboundPackage: (id: string) => void;
  getInboundByStatus: (status: InboundPackageStatus) => InboundPackage[];

  // Outbound actions
  addOutboundPackage: (pkg: OutboundPackage) => void;
  updateOutboundPackage: (id: string, updates: Partial<OutboundPackage>) => void;
  shipOutboundPackage: (id: string) => void;
  deliverOutboundPackage: (id: string) => void;
  cancelOutboundPackage: (id: string) => void;
  getOutboundByStatus: (status: OutboundPackageStatus) => OutboundPackage[];

  // Service Order actions
  addServiceOrder: (order: ServiceOrder) => void;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  moveServiceOrder: (id: string, newStatus: ServiceOrderStatus) => void;
  getServiceOrdersByStatus: (status: ServiceOrderStatus) => ServiceOrder[];
  getServiceOrdersByJira: (jiraKey: string) => ServiceOrder | undefined;

  // Shapeshift actions
  shapeshiftJobs: ShapeshiftJob[];
  addShapeshiftJob: (job: ShapeshiftJob) => void;
  updateShapeshiftJob: (id: string, updates: Partial<ShapeshiftJob>) => void;
  cancelShapeshiftJob: (id: string) => void;
}

export const usePackagesStore = create<PackagesStore>()(
  persist(
    (set, get) => ({
      inboundPackages: [],
      outboundPackages: [],
      serviceOrders: [],
      shapeshiftJobs: [],

      // ─── Inbound ────────────────────────────────────────────────────────
      addInboundPackage: (pkg) =>
        set((state) => ({ inboundPackages: [...state.inboundPackages, pkg] })),

      updateInboundPackage: (id, updates) =>
        set((state) => ({
          inboundPackages: state.inboundPackages.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      receiveInboundPackage: (id, receivedBy, itemsReceived) =>
        set((state) => ({
          inboundPackages: state.inboundPackages.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'received' as InboundPackageStatus,
                  itemsReceived: itemsReceived ?? p.itemsTotal,
                  receivedAt: new Date().toISOString(),
                  receivedBy,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      cancelInboundPackage: (id) =>
        set((state) => ({
          inboundPackages: state.inboundPackages.map((p) =>
            p.id === id
              ? { ...p, status: 'cancelled' as InboundPackageStatus, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      getInboundByStatus: (status) =>
        get().inboundPackages.filter((p) => p.status === status),

      // ─── Outbound ───────────────────────────────────────────────────────
      addOutboundPackage: (pkg) =>
        set((state) => ({ outboundPackages: [...state.outboundPackages, pkg] })),

      updateOutboundPackage: (id, updates) =>
        set((state) => ({
          outboundPackages: state.outboundPackages.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      shipOutboundPackage: (id) =>
        set((state) => ({
          outboundPackages: state.outboundPackages.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'shipped' as OutboundPackageStatus,
                  shippedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      deliverOutboundPackage: (id) =>
        set((state) => ({
          outboundPackages: state.outboundPackages.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'delivered' as OutboundPackageStatus,
                  deliveredAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      cancelOutboundPackage: (id) =>
        set((state) => ({
          outboundPackages: state.outboundPackages.map((p) =>
            p.id === id
              ? { ...p, status: 'cancelled' as OutboundPackageStatus, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      getOutboundByStatus: (status) =>
        get().outboundPackages.filter((p) => p.status === status),

      // ─── Service Orders ─────────────────────────────────────────────────
      addServiceOrder: (order) =>
        set((state) => ({ serviceOrders: [...state.serviceOrders, order] })),

      updateServiceOrder: (id, updates) =>
        set((state) => ({
          serviceOrders: state.serviceOrders.map((o) =>
            o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
          ),
        })),

      moveServiceOrder: (id, newStatus) =>
        set((state) => ({
          serviceOrders: state.serviceOrders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: newStatus,
                  columnEnteredAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  completedAt: newStatus === 'completed' ? new Date().toISOString() : o.completedAt,
                }
              : o
          ),
        })),

      getServiceOrdersByStatus: (status) =>
        get().serviceOrders.filter((o) => o.status === status),

      getServiceOrdersByJira: (jiraKey) =>
        get().serviceOrders.find((o) => o.jiraKey === jiraKey),

      // ─── Shapeshift Jobs ────────────────────────────────────────────────
      addShapeshiftJob: (job) =>
        set((state) => ({ shapeshiftJobs: [...state.shapeshiftJobs, job] })),

      updateShapeshiftJob: (id, updates) =>
        set((state) => ({
          shapeshiftJobs: state.shapeshiftJobs.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
          ),
        })),

      cancelShapeshiftJob: (id) =>
        set((state) => ({
          shapeshiftJobs: state.shapeshiftJobs.map((j) =>
            j.id === id ? { ...j, status: 'cancelled' as ShapeshiftJobStatus, updatedAt: new Date().toISOString() } : j
          ),
        })),
    }),
    {
      name: 'packages-store',
    }
  )
);
