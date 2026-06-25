'use client';

import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  onRename,
  onDelete,
  justUpdated,
  searchQuery = '',
}: {
  column: BoardColumnType;
  index: number;
  tasks: Task[];
  onCreateTask: (columnId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  onRename: (columnId: string, name: string) => void;
  onDelete: (columnId: string) => void;
  justUpdated: boolean;
  searchQuery?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({ id: column.id, data: { type: 'column', columnId: column.id } });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `zone:${column.id}`,
    data: { type: 'taskzone', columnId: column.id },
  });

  const columnStyle = { transform: CSS.Transform.toString(transform), transition };

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);
  const renameRef = useRef<HTMLInputElement>(null);

  function submitTask() {
    if (title.trim()) onCreateTask(column.id, title.trim());
    setTitle('');
    setAdding(false);
  }

  function startRename() {
    setRenameValue(column.name);
    setIsRenaming(true);
    setTimeout(() => renameRef.current?.select(), 0);
  }

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== column.name) onRename(column.id, trimmed);
    setIsRenaming(false);
  }

  function cancelRename() {
    setRenameValue(column.name);
    setIsRenaming(false);
  }

  return (
    <div
      ref={setSortableRef}
      style={columnStyle}
      className={clsx(
        'glass flex w-72 shrink-0 flex-col rounded-2xl shadow-card transition-shadow',
        isOver && 'ring-2 ring-violet',
        justUpdated && STATUS_GLOW[column.name],
        isColumnDragging && 'opacity-50',
      )}
    >
      <div
        className={clsx(
          'group/header flex items-center gap-2 border-b border-border px-3.5 py-3',
          !isRenaming && 'cursor-grab active:cursor-grabbing',
        )}
        {...(isRenaming ? {} : { ...attributes, ...listeners })}
      >
        <span className={clsx('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[column.name] ?? 'bg-muted')} />

        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 rounded border border-violet bg-surface px-1.5 py-0.5 text-sm font-semibold text-ink focus:outline-none"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{column.name}</h3>
        )}

        <span className="shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
          {tasks.length}
        </span>

        {!isRenaming && (
          <>
            {/* Pencil — rename */}
            <button
              onClick={(e) => { e.stopPropagation(); startRename(); }}
              className="shrink-0 text-muted opacity-0 transition-opacity hover:text-ink group-hover/header:opacity-100"
              aria-label="Rename column"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            {/* × — delete */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(column.id); }}
              className="shrink-0 text-lg leading-none text-muted opacity-0 transition-opacity hover:text-coral group-hover/header:opacity-100"
              aria-label="Delete column"
            >
              ×
            </button>
          </>
        )}
      </div>

      <div ref={setDropRef} className="flex min-h-[120px] flex-1 flex-col gap-2 p-2.5">
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
            onBlur={submitTask}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTask();
              if (e.key === 'Escape') { setTitle(''); setAdding(false); }
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
