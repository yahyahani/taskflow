'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { registerRequest } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center bg-base p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div>
          <div className="mb-2 font-display text-lg font-semibold text-ink">TaskFlow</div>
          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Already have one?{' '}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>

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
            className="rounded-md border border-status-progress/30 bg-status-progress/10 px-3 py-2 text-sm text-status-progress"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-3 py-2 font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
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
        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-ink placeholder:text-muted focus:border-accent"
      />
    </div>
  );
}
