'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchActivities } from '@/lib/activities-api';
import type { Activity } from '@/types';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = ['bg-violet', 'bg-sky', 'bg-coral', 'bg-mint', 'bg-amber'];

function avatarColor(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function activityText(activity: Activity): { verb: string; suffix?: string } {
  switch (activity.type) {
    case 'TASK_CREATED':
      return { verb: 'created' };
    case 'TASK_UPDATED':
      return { verb: 'updated' };
    case 'TASK_MOVED':
      return {
        verb: 'moved',
        suffix: activity.metadata?.columnName ? `→ ${activity.metadata.columnName}` : undefined,
      };
    default:
      return { verb: 'changed' };
  }
}

export function ActivityPanel({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', projectId],
    queryFn: () => fetchActivities(projectId),
    refetchInterval: 15_000,
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-surface shadow-card-hover">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display font-bold text-ink">Activity</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none text-muted hover:text-ink"
            aria-label="Close activity panel"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <p className="text-sm text-muted">Loading…</p>
          )}

          {!isLoading && activities.length === 0 && (
            <p className="text-sm text-muted">No activity yet. Create or move a task to get started.</p>
          )}

          <ul className="space-y-4">
            {activities.map((activity) => {
              const { verb, suffix } = activityText(activity);
              return (
                <li key={activity.id} className="flex gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(activity.user.name)}`}
                  >
                    {initials(activity.user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      <span className="font-medium">{activity.user.name}</span>
                      {' '}
                      <span className="text-muted">{verb}</span>
                      {' '}
                      <span className="font-medium">{activity.task.title}</span>
                      {suffix && (
                        <span className="text-muted"> {suffix}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
