'use client';

import { create } from 'zustand';

// eero Admin API sign-in status (prod + stage) for the Imports connection card.
// Not persisted — always fresh.
export type EeroState = 'connected' | 'not_signed_in' | 'expired' | 'cli_missing' | 'error';
export interface EeroCloudStatus { env: 'prod' | 'stage'; state: EeroState; source: string; user?: string; fix?: string }

interface EeroStatusStore {
  status: { prod: EeroCloudStatus; stage: EeroCloudStatus } | null;
  checking: boolean;
  checkedAt: number | null;
  refresh: () => Promise<void>;
}

export const useEeroStatusStore = create<EeroStatusStore>((set, get) => ({
  status: null,
  checking: false,
  checkedAt: null,
  refresh: async () => {
    if (get().checking) return;
    set({ checking: true });
    try {
      const d = await (await fetch('/api/insight?op=status&verify=1')).json();
      set({ status: d.auth || null, checkedAt: Date.now() });
    } catch {
      set({ status: null, checkedAt: Date.now() });
    } finally {
      set({ checking: false });
    }
  },
}));
