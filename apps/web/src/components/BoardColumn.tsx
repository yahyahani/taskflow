'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import type { BoardColumn as BoardColumnType, Task } from '@/types';
import { TaskCard } from './TaskCard';

const STATUS_GLOW: Record<string, string> = {
  'To Do': 'shadow-[inset_2px_0_0_0_#6B7280]',
  'In Progress': 'shadow-[inset_2px_0_0_0_#D4A24C]',
  'In Review': 'shadow-[inset_2px_0_0_0_#5B8DEF]',
  Done: 'shadow-[inset_2px_0_0_0_#4ABE8C]',
};

export function BoardColumn({
  column,
  index,
  tasks,
  onCreateTask,
  onDeleteTask,
  justUpdated,
}: {
  column: BoardColumnType;
  index: number;
  tasks: Task[];
  onCreateTask: (columnId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  justUpdated: boolean;
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
        'flex w-72 shrink-0 flex-col rounded-lg border border-border bg-panel transition-shadow',
        isOver && 'ring-1 ring-accent',
        justUpdated && STATUS_GLOW[column.name],
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="text-sm font-medium text-ink">{column.name}</h3>
        <span className="ml-auto font-mono text-xs text-muted">{tasks.length}</span>
      </div>

      <div ref={setNodeRef} className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
          ))}
        </SortableContext>
      </div>

      <div className="p-2">
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
            className="w-full rounded-md border border-border bg-base px-2 py-1.5 text-sm text-ink placeholder:text-muted focus:border-accent"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted transition-colors hover:bg-panel-hover hover:text-ink"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}
