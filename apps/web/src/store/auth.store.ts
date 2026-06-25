import { create } from 'zustand';
import type { User, Organization } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  activeOrganization: Organization | null;
  setSession: (data: { user: User; accessToken: string }) => void;
  setActiveOrganization: (org: Organization) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'taskflow.session';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  activeOrganization: null,

  setSession: ({ user, accessToken }) => {
    set({ user, accessToken });
    persist({ user, accessToken });
  },

  setActiveOrganization: (org) => {
    set((state) => {
      persist({ user: state.user, accessToken: state.accessToken, activeOrganization: org });
      return { activeOrganization: org };
    });
  },

  setAccessToken: (token) => {
    set((state) => {
      persist({ user: state.user, accessToken: token, activeOrganization: state.activeOrganization });
      return { accessToken: token };
    });
  },

  clear: () => {
    set({ user: null, accessToken: null, activeOrganization: null });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },

  // Called once on app mount to restore session from localStorage.
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<AuthState>;
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
