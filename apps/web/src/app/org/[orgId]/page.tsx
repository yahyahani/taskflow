'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, fetchProjects } from '@/lib/projects-api';
import { useAuthStore } from '@/store/auth.store';

export default function OrgDashboardPage() {
  const router = useRouter();
  const params = useParams<{ orgId: string }>();
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
    <main className="min-h-screen bg-base">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Workspace</p>
          <h1 className="font-display text-lg font-semibold text-ink">
            {activeOrganization?.name}
          </h1>
        </div>
        <Link href="/orgs" className="text-sm text-muted hover:text-ink">
          Switch workspace
        </Link>
      </header>

      <div className="mx-auto max-w-4xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Boards</h2>
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
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
            className="mb-6 flex gap-2"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board name, e.g. Q3 Launch"
              className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-ink placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
          </form>
        )}

        {isLoading && <p className="text-sm text-muted">Loading boards…</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          {projects?.map((p) => (
            <Link
              key={p.id}
              href={`/org/${params.orgId}/project/${p.id}`}
              className="rounded-md border border-border bg-panel p-4 transition-colors hover:bg-panel-hover"
            >
              <h3 className="font-medium text-ink">{p.name}</h3>
              {p.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>
              )}
              <p className="mt-3 font-mono text-xs text-muted">
                {p._count?.tasks ?? 0} task{p._count?.tasks === 1 ? '' : 's'}
              </p>
            </Link>
          ))}
        </div>

        {projects?.length === 0 && !isLoading && (
          <p className="text-sm text-muted">No boards yet — create your first one above.</p>
        )}
      </div>
    </main>
  );
}
