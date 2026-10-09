'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DemoProgram } from '@/components/programs/types';
import { INITIAL_PROGRAMS } from '@/components/programs/data';

// The program cards on the Programs page. Persisted (like deviceStore) so
// programs created in the app — including from a sheet upload — survive a reload.
interface BetaProgramsStore {
  programs: DemoProgram[];
  setPrograms: (update: (prev: DemoProgram[]) => DemoProgram[]) => void;
  addPrograms: (programs: DemoProgram[]) => void;
  // Person removed from the app → drop them from every program roster.
  removeTesterByEmail: (email: string) => void;
  // Seed programs' demo devices are written to deviceStore ONCE (SeedDataProvider);
  // after that the store is the only source, so deletions stick.
  seededProgramDevices: boolean;
  markProgramDevicesSeeded: () => void;
}

export const useBetaProgramsStore = create<BetaProgramsStore>()(
  persist(
    (set) => ({
      programs: INITIAL_PROGRAMS,
      setPrograms: (update) => set((state) => ({ programs: update(state.programs) })),
      addPrograms: (programs) => set((state) => ({ programs: [...state.programs, ...programs] })),
      removeTesterByEmail: (email) => {
        const e = email.toLowerCase().trim();
        set((state) => ({
          programs: state.programs.map((p) => (p.testers.some((t) => t.email.toLowerCase() === e)
            ? { ...p, testers: p.testers.filter((t) => t.email.toLowerCase() !== e) }
            : p)),
        }));
      },
      seededProgramDevices: false,
      markProgramDevicesSeeded: () => set({ seededProgramDevices: true }),
    }),
    { name: 'beta-programs-storage' },
  ),
);
