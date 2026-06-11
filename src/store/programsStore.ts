'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProgramOffering, ProgramSignup } from '@/types';

interface ProgramsStore {
  offerings: ProgramOffering[];
  signups: ProgramSignup[];

  // Offering actions (admin)
  addOffering: (offering: ProgramOffering) => void;
  updateOffering: (id: string, updates: Partial<ProgramOffering>) => void;
  deleteOffering: (id: string) => void;

  // Signup actions
  addSignup: (signup: ProgramSignup) => void;
  updateSignupStatus: (id: string, status: ProgramSignup['status']) => void;
  removeSignup: (id: string) => void;

  // Queries
  getSignupsForProgram: (programId: string) => ProgramSignup[];
  getSignupsForEmail: (email: string) => ProgramSignup[];
  hasSignedUp: (programId: string, email: string) => boolean;
}

// A couple of example offerings so the section isn't empty on first load.
const SEED_OFFERINGS: ProgramOffering[] = [
  {
    id: 'seed-foghorn-outdoor',
    name: 'Foghorn Outdoor Dogfood',
    product: 'Foghorn',
    description:
      'Help us test our next-generation outdoor eero. We need testers with an exterior mounting location and reliable power. You\'ll evaluate range, weatherproofing, and mesh performance outdoors.',
    status: 'open',
    startDate: '2026-07-01',
    signupDeadline: '2026-06-20',
    capacity: 40,
    requirements: 'Outdoor mounting location, weather exposure, 1G+ internet preferred.',
    phases: [
      { name: 'EVT', startDate: '2026-07-01', endDate: '2026-08-15' },
      { name: 'DVT', startDate: '2026-08-16', endDate: '2026-09-30' },
    ],
    createdBy: 'Beta Team',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-merci-wave2',
    name: 'Merci (eero Max 7) Wave 2',
    product: 'Merci',
    description:
      'Second wave of testing for the eero Max 7. Focused on multi-node mesh setups and 10G wired backhaul. Great for testers with larger homes.',
    status: 'upcoming',
    startDate: '2026-08-15',
    signupDeadline: '2026-08-01',
    capacity: 60,
    requirements: '3+ node mesh, 2000+ sq ft, multi-gig internet a plus.',
    phases: [
      { name: 'Beta', startDate: '2026-08-15', endDate: '2026-10-15' },
    ],
    createdBy: 'Beta Team',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
];

export const useProgramsStore = create<ProgramsStore>()(
  persist(
    (set, get) => ({
      offerings: SEED_OFFERINGS,
      signups: [],

      addOffering: (offering) => set((state) => ({ offerings: [...state.offerings, offering] })),

      updateOffering: (id, updates) =>
        set((state) => ({
          offerings: state.offerings.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),

      deleteOffering: (id) =>
        set((state) => ({
          offerings: state.offerings.filter((o) => o.id !== id),
          signups: state.signups.filter((s) => s.programId !== id),
        })),

      addSignup: (signup) => set((state) => ({ signups: [...state.signups, signup] })),

      updateSignupStatus: (id, status) =>
        set((state) => ({
          signups: state.signups.map((s) => (s.id === id ? { ...s, status } : s)),
        })),

      removeSignup: (id) =>
        set((state) => ({ signups: state.signups.filter((s) => s.id !== id) })),

      getSignupsForProgram: (programId) => get().signups.filter((s) => s.programId === programId),

      getSignupsForEmail: (email) =>
        get().signups.filter((s) => s.email.toLowerCase() === email.toLowerCase()),

      hasSignedUp: (programId, email) =>
        get().signups.some(
          (s) => s.programId === programId && s.email.toLowerCase() === email.toLowerCase()
        ),
    }),
    { name: 'programs-storage' }
  )
);
