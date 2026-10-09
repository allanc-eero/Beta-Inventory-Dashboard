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
}

export const useBetaProgramsStore = create<BetaProgramsStore>()(
  persist(
    (set) => ({
      programs: INITIAL_PROGRAMS,
      setPrograms: (update) => set((state) => ({ programs: update(state.programs) })),
      addPrograms: (programs) => set((state) => ({ programs: [...state.programs, ...programs] })),
    }),
    { name: 'beta-programs-storage' },
  ),
);
