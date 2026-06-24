'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrganization, fetchMyOrganizations } from '@/lib/organizations-api';
import { useAuthStore } from '@/store/auth.store';

export default function OrgsPage() {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization);
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
    <main className="min-h-screen bg-base p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-ink">Your workspaces</h1>
        <p className="mt-1 text-sm text-muted">Pick a workspace to open its boards.</p>

        <div className="mt-6 space-y-2">
          {isLoading && <p className="text-sm text-muted">Loading…</p>}
          {memberships?.map((m) => (
            <button
              key={m.id}
              onClick={() => selectOrg(m.organization.id, m.organization)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-panel px-4 py-3 text-left transition-colors hover:bg-panel-hover"
            >
              <span className="font-medium text-ink">{m.organization.name}</span>
              <span className="font-mono text-xs uppercase text-muted">{m.role}</span>
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
              className="text-sm font-medium text-accent hover:underline"
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
                className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-ink placeholder:text-muted focus:border-accent"
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90 disabled:opacity-60"
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
