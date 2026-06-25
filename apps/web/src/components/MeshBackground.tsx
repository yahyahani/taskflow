'use client';

import { useThemeStore } from '@/store/theme.store';

// Fixed full-viewport mesh gradient. Sits behind all page content via
// negative z-index — see .mesh-bg in globals.css.
export function MeshBackground() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div
      className={`mesh-bg ${theme === 'dark' ? 'bg-mesh-dark' : 'bg-mesh-light'}`}
      aria-hidden="true"
    />
  );
}
