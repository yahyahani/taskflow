import { create } from 'zustand';
import type { User, Organization } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeOrganization: Organization | null;
  setSession: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setActiveOrganization: (org: Organization) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'taskflow.session';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  activeOrganization: null,

  setSession: ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken });
    persist({ user, accessToken, refreshToken });
  },

  setActiveOrganization: (org) => {
    set((state) => {
      persist({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeOrganization: org,
      });
      return { activeOrganization: org };
    });
  },

  setAccessToken: (token) => {
    set((state) => {
      persist({
        user: state.user,
        accessToken: token,
        refreshToken: state.refreshToken,
        activeOrganization: state.activeOrganization,
      });
      return { accessToken: token };
    });
  },

  clear: () => {
    set({ user: null, accessToken: null, refreshToken: null, activeOrganization: null });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },

  // Called once on app mount to restore session from localStorage.
  // (Artifacts can't use localStorage, but this is a real Next.js app
  // running in its own deployment, so browser storage is fine here.)
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      set(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },
}));

function persist(data: Partial<AuthState>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
