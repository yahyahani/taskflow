'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { Task } from '@/types';

const STATUS_DOT: Record<Task['status'], string> = {
  TODO: 'bg-status-todo',
  IN_PROGRESS: 'bg-amber',
  IN_REVIEW: 'bg-sky',
  DONE: 'bg-mint',
};

const AVATAR_COLORS = ['bg-violet', 'bg-sky', 'bg-coral', 'bg-mint', 'bg-amber'];

function avatarColor(name: string) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
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

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-amber/30 text-inherit not-italic">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function formatDueDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.round((date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return { label: 'Today', overdue: false };
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false };
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  return { label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), overdue: false };
}

export function TaskCard({
  task,
  onDelete,
  onOpen,
  searchQuery = '',
}: {
  task: Task;
  onDelete: (id: string) => void;
  onOpen: (task: Task) => void;
  searchQuery?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        // dnd-kit suppresses click during an actual drag, so a plain
        // onClick here only fires for genuine clicks, not drags.
        if (!isDragging) onOpen(task);
      }}
      className={clsx(
        'group cursor-grab rounded-xl border border-border bg-surface p-3 shadow-card transition-shadow hover:shadow-card-hover active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: `${label.color}1A`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[task.status])} />
          <p className="text-sm text-ink">
            <Highlight text={task.title} query={searchQuery} />
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="shrink-0 text-muted opacity-0 transition-opacity hover:text-coral group-hover:opacity-100"
          aria-label="Delete task"
        >
          ×
        </button>
      </div>

      {(task.assignee || due) && (
        <div className="mt-2.5 flex items-center justify-between">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
                  avatarColor(task.assignee.name),
                )}
              >
                {initials(task.assignee.name)}
              </span>
              <span className="text-xs text-muted">{task.assignee.name.split(' ')[0]}</span>
            </div>
          ) : (
            <span />
          )}
          {due && (
            <span
              className={clsx(
                'text-xs font-medium',
                due.overdue ? 'text-coral' : 'text-muted',
              )}
            >
              {due.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
