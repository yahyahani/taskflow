'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { Task } from '@/types';

const STATUS_DOT: Record<Task['status'], string> = {
  TODO: 'bg-status-todo',
  IN_PROGRESS: 'bg-status-progress',
  IN_REVIEW: 'bg-status-review',
  DONE: 'bg-status-done',
};

export function TaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'group cursor-grab rounded-md border border-border bg-base p-3 active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[task.status])} />
          <p className="text-sm text-ink">{task.title}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="shrink-0 text-muted opacity-0 transition-opacity hover:text-status-progress group-hover:opacity-100"
          aria-label="Delete task"
        >
          ×
        </button>
      </div>
      {task.assignee && (
        <p className="mt-2 font-mono text-[11px] text-muted">{task.assignee.name}</p>
      )}
    </div>
  );
}
