'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginRequest } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <main className="grid min-h-screen grid-cols-1 bg-base md:grid-cols-2">
      {/* Left: brand panel — the signature element lives here */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-panel p-10 md:flex">
        <div className="font-display text-lg font-semibold tracking-tight text-ink">
          TaskFlow
        </div>

        <div className="space-y-6">
          <p className="font-display text-3xl leading-tight text-ink">
            Boards that move<br />as fast as your team.
          </p>
          <div className="flex gap-2 font-mono text-xs text-muted">
            <span className="rounded border border-border px-2 py-1 text-status-todo">TODO</span>
            <span className="rounded border border-border px-2 py-1 text-status-progress">
              IN PROGRESS
            </span>
            <span className="rounded border border-border px-2 py-1 text-status-review">
              IN REVIEW
            </span>
            <span className="rounded border border-border px-2 py-1 text-status-done">DONE</span>
          </div>
        </div>

        <p className="font-mono text-xs text-muted">Real-time boards for small teams.</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div className="mb-2 font-display text-lg font-semibold text-ink md:hidden">
            TaskFlow
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-muted">
              No account?{' '}
              <Link href="/register" className="text-accent hover:underline">
                Create one
              </Link>
            </p>
          </div>

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
              className="w-full rounded-md border border-border bg-panel px-3 py-2 text-ink placeholder:text-muted focus:border-accent"
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
              className="w-full rounded-md border border-border bg-panel px-3 py-2 text-ink placeholder:text-muted focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-status-progress/30 bg-status-progress/10 px-3 py-2 text-sm text-status-progress">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent px-3 py-2 font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
