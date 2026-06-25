'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { registerRequest } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { MeshBackground } from '@/components/MeshBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await registerRequest(form);
      setSession(session);
      if (session.organization) {
        setActiveOrganization(session.organization);
      }
      router.push('/orgs');
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message ?? 'Something went wrong creating your account.'
          : 'Something went wrong creating your account.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <MeshBackground />

      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="glass relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-card-hover">
        <Link href="/" className="inline-flex">
          <Logo size={26} textClassName="text-lg" />
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Already have one?{' '}
          <Link href="/login" className="font-medium text-violet hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-6 space-y-4">
          <Field label="Your name" id="name" value={form.name} onChange={update('name')} placeholder="Sam Rivera" />
          <Field
            label="Work email"
            id="email"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@company.com"
          />
          <Field
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="At least 8 characters"
          />
          <Field
            label="Organization name"
            id="organizationName"
            value={form.organizationName}
            onChange={update('organizationName')}
            placeholder="Acme Inc"
          />

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-amber/30 bg-amber-soft px-3 py-2 text-sm text-amber"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet px-3 py-2.5 font-semibold text-white shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        minLength={type === 'password' ? 8 : 2}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted focus:border-violet"
      />
    </div>
  );
}
