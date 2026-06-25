'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import type { BoardColumn as BoardColumnType, Task } from '@/types';
import { TaskCard } from './TaskCard';

const STATUS_DOT: Record<string, string> = {
  'To Do': 'bg-status-todo',
  'In Progress': 'bg-amber',
  'In Review': 'bg-sky',
  Done: 'bg-mint',
};

const STATUS_GLOW: Record<string, string> = {
  'To Do': 'shadow-[inset_3px_0_0_0_#8B8FA3]',
  'In Progress': 'shadow-[inset_3px_0_0_0_#FFA63E]',
  'In Review': 'shadow-[inset_3px_0_0_0_#3B9EFF]',
  Done: 'shadow-[inset_3px_0_0_0_#22C7A9]',
};

export function BoardColumn({
  column,
  tasks,
  onCreateTask,
  onDeleteTask,
  onOpenTask,
  justUpdated,
  searchQuery = '',
}: {
  column: BoardColumnType;
  index: number;
  tasks: Task[];
  onCreateTask: (columnId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  justUpdated: boolean;
  searchQuery?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { column } });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  function submit() {
    if (title.trim()) {
      onCreateTask(column.id, title.trim());
      setTitle('');
    }
    setAdding(false);
  }

  return (
    <div
      className={clsx(
        'glass flex w-72 shrink-0 flex-col rounded-2xl shadow-card transition-shadow',
        isOver && 'ring-2 ring-violet',
        justUpdated && STATUS_GLOW[column.name],
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
        <span className={clsx('h-2 w-2 rounded-full', STATUS_DOT[column.name] ?? 'bg-muted')} />
        <h3 className="text-sm font-semibold text-ink">{column.name}</h3>
        <span className="ml-auto rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex min-h-[120px] flex-1 flex-col gap-2 p-2.5">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onOpen={onOpenTask}
              searchQuery={searchQuery}
            />
          ))}
        </SortableContext>
      </div>

      <div className="p-2.5">
        {adding ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') {
                setTitle('');
                setAdding(false);
              }
            }}
            placeholder="Task title…"
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-ink placeholder:text-muted focus:border-violet"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}
