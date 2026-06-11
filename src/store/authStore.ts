'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'super_admin' | 'admin' | 'viewer' | 'beta_viewer' | 'dogfoofer';

export interface DogfoderProfile {
  phoneOS?: string;
  hasEeroNetwork?: string;
  networkEmail?: string;
  testGroup?: string;
  streetAddress?: string;
  aptUnit?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  sqFeet?: string;
  preferWorkAddress?: boolean;
  workStreet?: string;
  workFloor?: string;
  workCity?: string;
  workState?: string;
  workZip?: string;
  productionEmail?: string;
  registeredAt?: string;
  firstLoginAt?: string;
  welcomeSeen?: boolean;
}

export interface User {
  email: string;
  role: UserRole;
  name: string;
  status: 'active' | 'disabled';
  profile?: DogfoderProfile;
}

// ─── User Roster ──────────────────────────────────────────────────────────────
const USER_ROSTER: User[] = [
  { email: 'allanc@eero.com', role: 'super_admin', name: 'Allan C', status: 'active' },
  { email: 'haley.swanson@eero.com', role: 'admin', name: 'Haley Swanson', status: 'active' },
  { email: 'josht@eero.com', role: 'admin', name: 'Josh T', status: 'active' },
  { email: 'melanie.thorum@eero.com', role: 'admin', name: 'Melanie Thorum', status: 'active' },
  { email: 'shelby@eero.com', role: 'admin', name: 'Shelby', status: 'active' },
  { email: 'vrabago@eero.com', role: 'admin', name: 'V Rabago', status: 'active' },
  { email: 'aaron@eero.com', role: 'beta_viewer', name: 'Aaron', status: 'active' },
  { email: 'deep@eero.com', role: 'beta_viewer', name: 'Deep', status: 'active' },
  { email: 'lalitha@eero.com', role: 'beta_viewer', name: 'Lalitha', status: 'active' },
  { email: 'diego.kim@eero.com', role: 'beta_viewer', name: 'Diego Kim', status: 'active' },
  { email: 'jeffrey.bell@eero.com', role: 'beta_viewer', name: 'Jeffrey Bell', status: 'active' },
  { email: 'john.pelebo@eero.com', role: 'beta_viewer', name: 'John Pelebo', status: 'active' },
  { email: 'layton.hill@eero.com', role: 'beta_viewer', name: 'Layton Hill', status: 'active' },
  { email: 'philip.rivera@eero.com', role: 'beta_viewer', name: 'Philip Rivera', status: 'active' },
  { email: 'johnlushenko@eero.com', role: 'beta_viewer', name: 'John Lushenko', status: 'active' },
  { email: 'matthew.mullin@eero.com', role: 'beta_viewer', name: 'Matthew Mullin', status: 'active' },
  { email: 'stacia@eero.com', role: 'beta_viewer', name: 'Stacia', status: 'active' },
];

interface AuthStore {
  currentUser: User | null;
  users: User[];
  login: (email: string) => { success: boolean; error?: string };
  register: (email: string, name: string, profile?: DogfoderProfile) => { success: boolean; error?: string };
  logout: () => void;
  canEdit: () => boolean;
  canBrick: () => boolean;
  canManageUsers: () => boolean;
  isBetaViewer: () => boolean;
  isDogfoofer: () => boolean;
  isLoggedIn: () => boolean;
  addUser: (user: User) => void;
  disableUser: (email: string) => void;
  enableUser: (email: string) => void;
  changeRole: (email: string, role: UserRole) => void;
  markWelcomeSeen: () => void;
  updateProfile: (updates: Partial<DogfoderProfile>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: USER_ROSTER,

      login: (email) => {
        const e = email.toLowerCase().trim();
        if (!e.endsWith('@eero.com')) return { success: false, error: 'Only @eero.com accounts can access this tool.' };

        // Check if they're in the roster
        const user = get().users.find((u) => u.email.toLowerCase() === e);
        if (!user) return { success: false, error: 'Account not found. If you\'re a dogfooder, click "Register" below to create your account.' };
        if (user.status === 'disabled') return { success: false, error: 'Account disabled. Contact your admin.' };
        set({ currentUser: user });
        return { success: true };
      },

      register: (email, name, profile) => {
        const e = email.toLowerCase().trim();
        if (!e.endsWith('@eero.com')) return { success: false, error: 'Only @eero.com accounts can register.' };

        // Check if already registered
        const existing = get().users.find((u) => u.email.toLowerCase() === e);
        if (existing) return { success: false, error: 'Account already exists. Try signing in instead.' };

        const newUser: User = {
          email: e,
          role: 'dogfoofer',
          name: name.trim(),
          status: 'active',
          profile: { ...profile, registeredAt: new Date().toISOString(), firstLoginAt: new Date().toISOString() },
        };
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
        }));
        return { success: true };
      },

      logout: () => set({ currentUser: null }),

      canEdit: () => {
        const user = get().currentUser;
        return user?.role === 'super_admin' || user?.role === 'admin';
      },

      canBrick: () => {
        const user = get().currentUser;
        return user?.role === 'super_admin' || user?.role === 'admin';
      },

      canManageUsers: () => {
        const user = get().currentUser;
        return user?.role === 'super_admin';
      },

      isBetaViewer: () => {
        const user = get().currentUser;
        return user?.role === 'beta_viewer';
      },

      isDogfoofer: () => {
        const user = get().currentUser;
        return user?.role === 'dogfoofer';
      },

      isLoggedIn: () => get().currentUser !== null,

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),

      disableUser: (email) => set((state) => ({
        users: state.users.map((u) => u.email.toLowerCase() === email.toLowerCase() ? { ...u, status: 'disabled' } : u),
      })),

      enableUser: (email) => set((state) => ({
        users: state.users.map((u) => u.email.toLowerCase() === email.toLowerCase() ? { ...u, status: 'active' } : u),
      })),

      changeRole: (email, role) => set((state) => ({
        users: state.users.map((u) => u.email.toLowerCase() === email.toLowerCase() ? { ...u, role } : u),
      })),

      markWelcomeSeen: () => set((state) => {
        const current = state.currentUser;
        if (!current) return {};
        const updatedUser: User = {
          ...current,
          profile: { ...current.profile, welcomeSeen: true },
        };
        return {
          currentUser: updatedUser,
          users: state.users.map((u) =>
            u.email.toLowerCase() === current.email.toLowerCase() ? updatedUser : u
          ),
        };
      }),

      updateProfile: (updates) => set((state) => {
        const current = state.currentUser;
        if (!current) return {};
        const updatedUser: User = {
          ...current,
          profile: { ...current.profile, ...updates },
        };
        return {
          currentUser: updatedUser,
          users: state.users.map((u) =>
            u.email.toLowerCase() === current.email.toLowerCase() ? updatedUser : u
          ),
        };
      }),
    }),
    { name: 'auth-storage' }
  )
);
