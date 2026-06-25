'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from '@/lib/organizations-api';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { MeshBackground } from '@/components/MeshBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Member } from '@/types';

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-violet/15 text-violet',
  ADMIN: 'bg-sky/15 text-sky',
  MEMBER: 'bg-surface-hover text-muted',
};

const AVATAR_COLORS = ['bg-violet', 'bg-sky', 'bg-coral', 'bg-mint', 'bg-amber'];

function avatarColor(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function MembersPage() {
  const router = useRouter();
  const params = useParams<{ orgId: string }>();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState('');

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

  const membersKey = ['members', params.orgId];

  const { data: members = [], isLoading } = useQuery({
    queryKey: membersKey,
    queryFn: () => fetchMembers(params.orgId),
    enabled: !!activeOrganization,
  });

  const currentMembership = members.find((m) => m.user.id === user?.id);
  const currentRole = currentMembership?.role ?? 'MEMBER';
  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      inviteMember(params.orgId, email, role),
    onSuccess: (member) => {
      queryClient.setQueryData<Member[]>(membersKey, (old) => [...(old ?? []), member]);
      setInviteEmail('');
      setInviteError('');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setInviteError(err.response?.data?.message ?? 'Failed to invite member');
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(params.orgId, userId, role),
    onSuccess: (updated) => {
      queryClient.setQueryData<Member[]>(membersKey, (old) =>
        (old ?? []).map((m) => (m.user.id === updated.user.id ? updated : m)),
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(params.orgId, userId),
    onSuccess: (_void, userId) => {
      queryClient.setQueryData<Member[]>(membersKey, (old) =>
        (old ?? []).filter((m) => m.user.id !== userId),
      );
    },
  });

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  }

  // Role options available to the current actor.
  // ADMINs cannot assign or remove OWNER; OWNERs can assign any role.
  function roleOptions() {
    const all = ['OWNER', 'ADMIN', 'MEMBER'] as const;
    return all.filter((r) => currentRole === 'OWNER' || r !== 'OWNER');
  }

  // Whether the actor can change this member's role / remove them.
  function canEdit(member: Member) {
    if (member.user.id === user?.id) return false; // can't edit yourself
    if (member.role === 'OWNER') return false; // can't touch the owner
    if (currentRole === 'ADMIN' && member.role === 'ADMIN') return false; // admin can't edit other admins
    return canManage;
  }

  return (
    <main className="relative min-h-screen">
      <MeshBackground />

      <header className="glass relative z-10 flex items-center justify-between px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href={`/org/${params.orgId}`}
            className="text-sm font-medium text-muted hover:text-ink"
          >
            ← {activeOrganization?.name}
          </Link>
          <span className="text-muted">/</span>
          <h1 className="font-display font-bold text-ink">Members</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="relative z-10 mx-auto max-w-2xl p-6 sm:p-8">

        {/* Invite form — OWNER/ADMIN only */}
        {canManage && (
          <section className="glass mb-8 rounded-2xl p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-ink">Invite a member</h2>
            <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="invite-email" className="mb-1 block text-xs font-medium text-muted">
                  Email address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                  placeholder="colleague@example.com"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-muted">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none"
                >
                  {currentRole === 'OWNER' && <option value="OWNER">Owner</option>}
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
                className="rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
              >
                {inviteMutation.isPending ? 'Inviting…' : 'Invite'}
              </button>
            </form>
            {inviteError && (
              <p className="mt-2 text-xs font-medium text-coral">{inviteError}</p>
            )}
            {inviteMutation.isSuccess && (
              <p className="mt-2 text-xs font-medium text-mint">Member added successfully.</p>
            )}
          </section>
        )}

        {/* Member list */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Members
            {members.length > 0 && (
              <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
                {members.length}
              </span>
            )}
          </h2>

          {isLoading && <p className="text-sm text-muted">Loading members…</p>}

          <ul className="glass divide-y divide-border rounded-2xl shadow-card">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(member.user.name)}`}
                >
                  {initials(member.user.name)}
                </div>

                {/* Name + email */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {member.user.name}
                    {member.user.id === user?.id && (
                      <span className="ml-1.5 text-xs text-muted">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">{member.user.email}</p>
                </div>

                {/* Role — dropdown if editable, badge if not */}
                {canEdit(member) ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      roleChangeMutation.mutate({ userId: member.user.id, role: e.target.value })
                    }
                    disabled={roleChangeMutation.isPending}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink focus:border-violet focus:outline-none"
                  >
                    {roleOptions().map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[member.role] ?? ROLE_BADGE.MEMBER}`}
                  >
                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                  </span>
                )}

                {/* Remove button */}
                {canEdit(member) && (
                  <button
                    onClick={() => removeMutation.mutate(member.user.id)}
                    disabled={removeMutation.isPending}
                    className="ml-1 shrink-0 text-lg leading-none text-muted hover:text-coral disabled:opacity-40"
                    aria-label={`Remove ${member.user.name}`}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          {members.length === 0 && !isLoading && (
            <div className="glass rounded-2xl p-8 text-center shadow-card">
              <p className="text-sm text-muted">No members found.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
