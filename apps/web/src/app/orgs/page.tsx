'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrganization, fetchMyOrganizations } from '@/lib/organizations-api';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { MeshBackground } from '@/components/MeshBackground';
import { ThemeToggle } from '@/components/ThemeToggle';

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-violet-soft text-violet',
  ADMIN: 'bg-sky-soft text-sky',
  MEMBER: 'bg-mint-soft text-mint',
};

const AVATAR_THEMES = ['bg-violet', 'bg-sky', 'bg-coral', 'bg-mint', 'bg-amber'];

function orgInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

export default function OrgsPage() {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization);
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const { data: memberships, isLoading } = useQuery({
    queryKey: ['organizations', 'mine'],
    queryFn: fetchMyOrganizations,
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', 'mine'] });
      setActiveOrganization(org);
      router.push(`/org/${org.id}`);
      setCreating(false);
      setNewOrgName('');
    },
  });

  function selectOrg(orgId: string, org: { id: string; name: string; slug: string }) {
    setActiveOrganization(org);
    router.push(`/org/${orgId}`);
  }

  return (
    <main className="relative min-h-screen p-6 sm:p-8">
      <MeshBackground />

      <div className="absolute right-6 top-6 z-10 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl pt-10">
        <h1 className="font-display text-3xl font-bold text-ink">Your workspaces</h1>
        <p className="mt-1 text-muted">Pick a workspace to open its boards.</p>

        <div className="mt-6 space-y-2.5">
          {isLoading && <p className="text-sm text-muted">Loading…</p>}
          {memberships?.map((m, i) => (
            <button
              key={m.id}
              onClick={() => selectOrg(m.organization.id, m.organization)}
              className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white ${AVATAR_THEMES[i % AVATAR_THEMES.length]}`}
              >
                {orgInitial(m.organization.name)}
              </span>
              <span className="flex-1 font-semibold text-ink">{m.organization.name}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE[m.role] ?? 'bg-surface text-muted'}`}>
                {m.role}
              </span>
            </button>
          ))}
          {memberships?.length === 0 && (
            <p className="text-sm text-muted">
              You don&apos;t belong to any workspace yet — create one below.
            </p>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="text-sm font-semibold text-violet hover:underline"
            >
              + Create a new workspace
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newOrgName.trim()) createMutation.mutate(newOrgName.trim());
              }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Workspace name"
                className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted focus:border-violet"
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-xl bg-violet px-5 py-2.5 font-semibold text-white shadow-glow disabled:opacity-60"
              >
                Create
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
