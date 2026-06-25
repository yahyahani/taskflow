'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLabels } from '@/lib/labels-api';
import { fetchMembers } from '@/lib/organizations-api';
import type { Member, Label, Priority } from '@/types';
import clsx from 'clsx';

const PRIORITY_OPTIONS: { value: Priority; label: string; activeClass: string }[] = [
  { value: 'LOW',    label: 'Low',    activeClass: 'bg-surface-hover text-ink border-border' },
  { value: 'MEDIUM', label: 'Med',    activeClass: 'bg-sky/15 text-sky border-sky/30' },
  { value: 'HIGH',   label: 'High',   activeClass: 'bg-amber/15 text-amber border-amber/30' },
  { value: 'URGENT', label: 'Urgent', activeClass: 'bg-coral/15 text-coral border-coral/30' },
];

const AVATAR_COLORS = ['bg-violet', 'bg-sky', 'bg-coral', 'bg-mint', 'bg-amber'];

function avatarColor(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export function BoardFilters({
  orgId,
  filterAssigneeId,
  filterLabelIds,
  filterPriority,
  onAssigneeChange,
  onLabelToggle,
  onPriorityToggle,
  onClear,
}: {
  orgId: string;
  filterAssigneeId: string;
  filterLabelIds: string[];
  filterPriority: Priority[];
  onAssigneeChange: (id: string) => void;
  onLabelToggle: (id: string) => void;
  onPriorityToggle: (p: Priority) => void;
  onClear: () => void;
}) {
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['members', orgId],
    queryFn: () => fetchMembers(orgId),
  });

  const { data: labels = [] } = useQuery<Label[]>({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

  const selectedMember = members.find((m) => m.user.id === filterAssigneeId);
  const hasFilters = filterAssigneeId || filterLabelIds.length > 0 || filterPriority.length > 0;

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-4 border-b border-border bg-surface/60 px-6 py-2.5 sm:px-8">

      {/* Assignee */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted">Assignee</span>
        <div className="flex items-center gap-1.5">
          {selectedMember && (
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${avatarColor(selectedMember.user.name)}`}
            >
              {initials(selectedMember.user.name)}
            </div>
          )}
          <select
            value={filterAssigneeId}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink focus:border-violet focus:outline-none"
          >
            <option value="">Anyone</option>
            <option value="__unassigned__">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority chips */}
      {PRIORITY_OPTIONS.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted">Priority</span>
          {PRIORITY_OPTIONS.map((p) => {
            const active = filterPriority.includes(p.value);
            return (
              <button
                key={p.value}
                onClick={() => onPriorityToggle(p.value)}
                className={clsx(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                  active
                    ? p.activeClass
                    : 'border-border text-muted hover:border-border hover:text-ink',
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Label chips */}
      {labels.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted">Label</span>
          {labels.map((label) => {
            const active = filterLabelIds.includes(label.id);
            return (
              <button
                key={label.id}
                onClick={() => onLabelToggle(label.id)}
                className={clsx(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                  active ? 'border-transparent' : 'border-border text-muted hover:text-ink',
                )}
                style={
                  active
                    ? { backgroundColor: `${label.color}22`, color: label.color, borderColor: `${label.color}44` }
                    : undefined
                }
              >
                {label.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="ml-auto text-xs font-medium text-muted hover:text-coral"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
