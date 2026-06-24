'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function HomePage() {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    router.replace(user ? '/orgs' : '/login');
  }, [user, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-base">
      <p className="font-mono text-sm text-muted">Loading TaskFlow…</p>
    </main>
  );
}
