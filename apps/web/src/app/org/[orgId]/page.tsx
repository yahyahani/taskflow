'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, fetchProjects } from '@/lib/projects-api';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { MeshBackground } from '@/components/MeshBackground';
import { ThemeToggle } from '@/components/ThemeToggle';

const CARD_THEMES = [
  { bg: 'bg-violet-soft', text: 'text-violet', ring: 'group-hover:ring-violet/40' },
  { bg: 'bg-sky-soft', text: 'text-sky', ring: 'group-hover:ring-sky/40' },
  { bg: 'bg-coral-soft', text: 'text-coral', ring: 'group-hover:ring-coral/40' },
  { bg: 'bg-mint-soft', text: 'text-mint', ring: 'group-hover:ring-mint/40' },
  { bg: 'bg-amber-soft', text: 'text-amber', ring: 'group-hover:ring-amber/40' },
];

const BOARD_ICONS = [BoardIconA, BoardIconB, BoardIconC, BoardIconD, BoardIconE];

export default function OrgDashboardPage() {
  const router = useRouter();
  const params = useParams<{ orgId: string }>();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (!activeOrganization || activeOrganization.id !== params.orgId) {
      router.replace('/orgs');
    }
  }, [user, activeOrganization, params.orgId, router]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', params.orgId],
    queryFn: fetchProjects,
    enabled: !!activeOrganization,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects', params.orgId] });
      router.push(`/org/${params.orgId}/project/${project.id}`);
    },
  });

  return (
    <main className="relative min-h-screen">
      <MeshBackground />

      <header className="glass relative z-10 flex items-center justify-between px-6 py-5 sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Workspace</p>
          <h1 className="font-display text-lg font-bold text-ink">{activeOrganization?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/orgs" className="text-sm font-medium text-muted hover:text-ink">
            Switch workspace
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Boards</h2>
          <button
            onClick={() => setCreating(true)}
            className="rounded-full bg-violet px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
          >
            + New board
          </button>
        </div>

        {creating && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) createMutation.mutate({ name: name.trim() });
            }}
            className="glass mb-6 flex gap-2 rounded-2xl p-2 shadow-card"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board name, e.g. Q3 Launch"
              className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted focus:border-violet"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>
          </form>
        )}

        {isLoading && <p className="text-sm text-muted">Loading boards…</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          {projects?.map((p, i) => {
            const theme = CARD_THEMES[i % CARD_THEMES.length];
            const Icon = BOARD_ICONS[i % BOARD_ICONS.length];
            return (
              <Link
                key={p.id}
                href={`/org/${params.orgId}/project/${p.id}`}
                className={`group glass rounded-2xl p-5 shadow-card ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${theme.ring}`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${theme.bg} ${theme.text}`}>
                  <Icon />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{p.name}</h3>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>
                )}
                <p className="mt-3 text-xs font-semibold text-muted">
                  {p._count?.tasks ?? 0} task{p._count?.tasks === 1 ? '' : 's'}
                </p>
              </Link>
            );
          })}
        </div>

        {projects?.length === 0 && !isLoading && (
          <div className="glass rounded-2xl p-10 text-center shadow-card">
            <p className="text-sm text-muted">No boards yet — create your first one above.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function BoardIconA() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function BoardIconB() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BoardIconC() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BoardIconD() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 11 18-5v12L3 14v-3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BoardIconE() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
