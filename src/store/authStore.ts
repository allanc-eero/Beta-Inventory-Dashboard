'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface User {
  email: string;
  role: UserRole;
  name: string;
  status: 'active' | 'disabled';
}

// ─── User Roster ──────────────────────────────────────────────────────────────
const USER_ROSTER: User[] = [
  { email: 'allanc@eero.com', role: 'super_admin', name: 'Allan C', status: 'active' },
  { email: 'haley.swanson@eero.com', role: 'admin', name: 'Haley Swanson', status: 'active' },
  { email: 'aaron@eero.com', role: 'viewer', name: 'Aaron', status: 'active' },
  { email: 'deep@eero.com', role: 'viewer', name: 'Deep', status: 'active' },
  { email: 'josht@eero.com', role: 'viewer', name: 'Josh T', status: 'active' },
  { email: 'lalitha@eero.com', role: 'viewer', name: 'Lalitha', status: 'active' },
  { email: 'melanie.thorum@eero.com', role: 'viewer', name: 'Melanie Thorum', status: 'active' },
  { email: 'shelby@eero.com', role: 'viewer', name: 'Shelby', status: 'active' },
  { email: 'vrabago@eero.com', role: 'viewer', name: 'V Rabago', status: 'active' },
  { email: 'diego.kim@eero.com', role: 'viewer', name: 'Diego Kim', status: 'active' },
  { email: 'john.pelebo@eero.com', role: 'viewer', name: 'John Pelebo', status: 'active' },
  { email: 'layton.hill@eero.com', role: 'viewer', name: 'Layton Hill', status: 'active' },
  { email: 'philip.rivera@eero.com', role: 'viewer', name: 'Philip Rivera', status: 'active' },
];

interface AuthStore {
  currentUser: User | null;
  users: User[];
  login: (email: string) => { success: boolean; error?: string };
  logout: () => void;
  canEdit: () => boolean;
  canBrick: () => boolean;
  canManageUsers: () => boolean;
  isLoggedIn: () => boolean;
  addUser: (user: User) => void;
  disableUser: (email: string) => void;
  enableUser: (email: string) => void;
  changeRole: (email: string, role: UserRole) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: USER_ROSTER,

      login: (email) => {
        const e = email.toLowerCase().trim();
        const user = get().users.find((u) => u.email.toLowerCase() === e);
        if (!user) return { success: false, error: 'Email not found. Contact your admin for access.' };
        if (user.status === 'disabled') return { success: false, error: 'Account disabled. Contact your admin.' };
        set({ currentUser: user });
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
    }),
    { name: 'auth-storage' }
  )
);
