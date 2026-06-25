'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { MeshBackground } from '@/components/MeshBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Logo } from '@/components/Logo';

const FEATURES = [
  {
    title: 'Real-time boards',
    description: 'Move a card and your team sees it instantly — no refresh, no waiting.',
    color: 'bg-violet-soft text-violet',
    icon: BoltIcon,
  },
  {
    title: 'Built for teams',
    description: 'Every workspace is fully isolated. Invite people, assign roles, stay organized.',
    color: 'bg-sky-soft text-sky',
    icon: UsersIcon,
  },
  {
    title: 'Drag, drop, done',
    description: 'A board that feels as fast as sticky notes, with none of the mess.',
    color: 'bg-coral-soft text-coral',
    icon: HandIcon,
  },
  {
    title: 'Secure by design',
    description: 'Rotating tokens, verified access on every request, nothing left to chance.',
    color: 'bg-mint-soft text-mint',
    icon: ShieldIcon,
  },
  {
    title: 'Light or dark',
    description: 'Switch themes anytime. Your eyes, your call.',
    color: 'bg-amber-soft text-amber',
    icon: SunMoonIcon,
  },
  {
    title: 'Always in sync',
    description: 'Every teammate, every tab, the same board — automatically.',
    color: 'bg-violet-soft text-violet',
    icon: SyncIcon,
  },
];

export default function HomePage() {
  const router = useRouter();
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
  }, [hydrateAuth, hydrateTheme]);

  useEffect(() => {
    if (user) router.replace('/orgs');
  }, [user, router]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <MeshBackground />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo size={26} textClassName="text-lg" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-violet px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-16 text-center sm:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-1.5 text-sm font-medium text-muted backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-mint" />
          Live boards, zero setup
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-6xl">
          Project boards that{' '}
          <span className="bg-gradient-to-r from-violet via-sky to-coral bg-clip-text text-transparent">
            move with your team
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Create a workspace, drag your first task into place, and watch everyone stay
          in sync — in real time, on every device.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-full bg-violet px-7 py-3 font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border bg-surface px-7 py-3 font-semibold text-ink transition-colors hover:bg-surface-hover"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Board preview */}
      <section className="relative z-10 mx-auto mt-16 max-w-5xl px-6 sm:mt-24">
        <div className="glass rounded-2xl p-3 shadow-card-hover sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'To Do', color: 'bg-status-todo', count: 3 },
              { label: 'In Progress', color: 'bg-amber', count: 2 },
              { label: 'In Review', color: 'bg-sky', count: 1 },
              { label: 'Done', color: 'bg-mint', count: 5 },
            ].map((col) => (
              <div key={col.label} className="rounded-xl bg-surface p-3 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-ink">{col.label}</span>
                  <span className="ml-auto text-xs text-muted">{col.count}</span>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: col.label === 'Done' ? 2 : col.count }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 rounded-lg border border-border bg-base/40"
                      style={{ opacity: 1 - i * 0.25 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto mt-24 max-w-5xl px-6 pb-24 sm:mt-32">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Everything your team needs
          </h2>
          <p className="mt-3 text-muted">No bloat. Just the features that keep work moving.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="glass rounded-2xl p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                <feature.icon />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="glass rounded-3xl p-10 shadow-glow sm:p-14">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Ready to get your team moving?
          </h2>
          <p className="mt-3 text-muted">Set up your first board in under a minute.</p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-full bg-violet px-8 py-3 font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
          >
            Create your workspace
          </Link>
        </div>
      </section>
    </main>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function HandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11.5V6a2 2 0 1 1 4 0v5M13 11V4a2 2 0 1 1 4 0v9" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M17 13V9a2 2 0 1 1 4 0v6a6 6 0 0 1-6 6h-2a8 8 0 0 1-7-4l-2.5-4.33a1.6 1.6 0 0 1 2.77-1.6L7 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SunMoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M2 12h2M20 12h2" strokeLinecap="round" />
    </svg>
  );
}
function SyncIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M21 2v6h-6M3 22v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L21 8M20.49 15a9 9 0 0 1-14.85 3.36L3 16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
