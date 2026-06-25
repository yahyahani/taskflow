'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginRequest } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { MeshBackground } from '@/components/MeshBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await loginRequest(email, password);
      setSession(session);
      router.push('/orgs');
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message ?? 'Something went wrong signing you in.'
          : 'Something went wrong signing you in.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <MeshBackground />

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      {/* Left: brand panel */}
      <div className="relative z-10 hidden flex-col justify-between p-12 lg:flex">
        <Link href="/" className="inline-flex">
          <Logo size={26} textClassName="text-lg" />
        </Link>

        <div className="space-y-6">
          <p className="font-display text-4xl font-extrabold leading-tight text-ink">
            Boards that{' '}
            <span className="bg-gradient-to-r from-violet via-sky to-coral bg-clip-text text-transparent">
              move with your team
            </span>
          </p>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <span className="rounded-full bg-violet-soft px-3 py-1 text-violet">To Do</span>
            <span className="rounded-full bg-amber-soft px-3 py-1 text-amber">In Progress</span>
            <span className="rounded-full bg-sky-soft px-3 py-1 text-sky">In Review</span>
            <span className="rounded-full bg-mint-soft px-3 py-1 text-mint">Done</span>
          </div>
        </div>

        <p className="text-sm text-muted">Real-time boards for small teams.</p>
      </div>

      {/* Right: form */}
      <div className="relative z-10 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="glass w-full max-w-sm rounded-3xl p-8 shadow-card-hover">
          <div className="mb-6 lg:hidden">
            <Logo size={24} textClassName="text-lg" />
          </div>

          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">
            No account?{' '}
            <Link href="/register" className="font-medium text-violet hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted focus:border-violet"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted focus:border-violet"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-amber/30 bg-amber-soft px-3 py-2 text-sm text-amber">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet px-3 py-2.5 font-semibold text-white shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
