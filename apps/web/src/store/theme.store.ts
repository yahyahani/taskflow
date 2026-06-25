import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'taskflow.theme';

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  toggle: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },

  // Called once on mount: prefers a saved choice, falls back to the
  // user's OS-level preference, defaults to light.
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme: Theme = saved ?? (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
    set({ theme });
  },
}));
