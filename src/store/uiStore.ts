'use client';

import { create } from 'zustand';
import { Device } from '@/types';

// Cohort/environment lens for the whole app. 'all' = show everything (default);
// 'beta' = production cohort; 'dogfood' = stage cohort.
export type CohortFilter = 'all' | 'beta' | 'dogfood';

// A device's cohort: dogfood → 'dogfood', everything else (beta + hardware phase
// codes prq/pvt/evt/dvt/other) → 'beta'. Mirrors the prod/stage link routing.
export function cohortOf(d: Pick<Device, 'program'>): 'beta' | 'dogfood' {
  return d.program === 'dogfood' ? 'dogfood' : 'beta';
}

// Does a device pass the current cohort lens?
export function matchesCohort(d: Pick<Device, 'program'>, filter: CohortFilter): boolean {
  return filter === 'all' || cohortOf(d) === filter;
}

interface UiStore {
  cohort: CohortFilter;
  setCohort: (c: CohortFilter) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  cohort: 'all',
  setCohort: (cohort) => set({ cohort }),
}));
