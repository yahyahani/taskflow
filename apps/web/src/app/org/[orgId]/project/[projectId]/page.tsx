'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { addColumn, deleteColumn, fetchProject, renameColumn, reorderColumn } from '@/lib/projects-api';
import { createTask, deleteTask, fetchTasks, moveTask, searchTasks, updateTask } from '@/lib/tasks-api';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useBoardSocket } from '@/lib/use-board-socket';
import { ActivityPanel } from '@/components/ActivityPanel';
import { BoardColumn } from '@/components/BoardColumn';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MeshBackground } from '@/components/MeshBackground';
import type { BoardColumn as BoardColumnType, Priority, Project, Task, TaskStatus } from '@/types';

const STATUS_BY_COLUMN_NAME: Record<string, TaskStatus> = {
  'To Do': 'TODO',
  'In Progress': 'IN_PROGRESS',
  'In Review': 'IN_REVIEW',
  Done: 'DONE',
};

export default function ProjectBoardPage() {
  const router = useRouter();
  const params = useParams<{ orgId: string; projectId: string }>();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const queryClient = useQueryClient();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumnType | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [recentlyUpdatedColumn, setRecentlyUpdatedColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showActivity, setShowActivity] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: project } = useQuery({
    queryKey: ['project', params.projectId],
    queryFn: () => fetchProject(params.projectId),
    enabled: !!activeOrganization,
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', params.projectId],
    queryFn: () => fetchTasks(params.projectId),
    enabled: !!activeOrganization,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['tasks', params.projectId, 'search', debouncedQuery],
    queryFn: () => searchTasks(params.projectId, debouncedQuery),
    enabled: !!activeOrganization && debouncedQuery.length > 0,
  });

  const displayTasks = useMemo(
    () => (debouncedQuery ? (searchResults ?? []) : (tasks ?? [])),
    [debouncedQuery, searchResults, tasks],
  );

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of displayTasks) {
      const list = map.get(task.columnId) ?? [];
      list.push(task);
      map.set(task.columnId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [displayTasks]);

  // --- Real-time: merge socket events straight into the React Query cache
  // so every connected client sees moves/creates/deletes without a refetch.
  useBoardSocket({
    onTaskCreated: (task) => upsertTask(task),
    onTaskUpdated: (task) => upsertTask(task),
    onTaskMoved: (task) => {
      upsertTask(task);
      flashColumn(task.columnId);
    },
    onTaskDeleted: ({ id }) => {
      queryClient.setQueryData<Task[]>(['tasks', params.projectId], (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
    },
    onColumnReordered: (columns) => {
      queryClient.setQueryData<Project>(['project', params.projectId], (old) =>
        old ? { ...old, columns } : old,
      );
    },
  });

  function upsertTask(task: Task) {
    queryClient.setQueryData<Task[]>(['tasks', params.projectId], (old) => {
      const existing = old ?? [];
      const idx = existing.findIndex((t) => t.id === task.id);
      if (idx === -1) return [...existing, task];
      const next = [...existing];
      next[idx] = task;
      return next;
    });
  }

  function flashColumn(columnId: string) {
    setRecentlyUpdatedColumn(columnId);
    setTimeout(() => setRecentlyUpdatedColumn((c) => (c === columnId ? null : c)), 900);
  }

  const createMutation = useMutation({
    mutationFn: ({ columnId, title }: { columnId: string; title: string }) =>
      createTask(params.projectId, { title, columnId }),
    onSuccess: (task) => upsertTask(task),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      ...payload
    }: {
      taskId: string;
      description?: string;
      assigneeId?: string | null;
      dueDate?: string;
      priority?: Priority;
      labelIds?: string[];
    }) => updateTask(params.projectId, taskId, payload),
    onSuccess: (task) => upsertTask(task),
  });

  const moveMutation = useMutation({
    mutationFn: ({
      taskId,
      columnId,
      position,
      status,
    }: {
      taskId: string;
      columnId: string;
      position: number;
      status: TaskStatus;
    }) => moveTask(params.projectId, taskId, { columnId, position, status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(params.projectId, taskId),
    onSuccess: (_void, taskId) => {
      queryClient.setQueryData<Task[]>(['tasks', params.projectId], (old) =>
        (old ?? []).filter((t) => t.id !== taskId),
      );
    },
  });

  const reorderColumnMutation = useMutation({
    mutationFn: ({ columnId, position }: { columnId: string; position: number }) =>
      reorderColumn(params.projectId, columnId, position),
  });

  const addColumnMutation = useMutation({
    mutationFn: (name: string) => addColumn(params.projectId, name),
    onSuccess: (column) => {
      queryClient.setQueryData<Project>(['project', params.projectId], (old) =>
        old ? { ...old, columns: [...old.columns, column] } : old,
      );
    },
  });

  const renameColumnMutation = useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      renameColumn(params.projectId, columnId, name),
    onSuccess: (column) => {
      queryClient.setQueryData<Project>(['project', params.projectId], (old) =>
        old ? { ...old, columns: old.columns.map((c) => (c.id === column.id ? column : c)) } : old,
      );
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) => deleteColumn(params.projectId, columnId),
    onSuccess: (_void, columnId) => {
      queryClient.setQueryData<Project>(['project', params.projectId], (old) =>
        old ? { ...old, columns: old.columns.filter((c) => c.id !== columnId) } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['tasks', params.projectId] });
    },
  });

  function handleDeleteColumn(columnId: string) {
    if (!window.confirm('Delete this column? Tasks will be moved to the first column.')) return;
    deleteColumnMutation.mutate(columnId);
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'column') {
      const col = project?.columns.find((c) => c.id === event.active.id) ?? null;
      setActiveColumn(col);
      return;
    }
    const task = (tasks ?? []).find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);
    if (!over) return;

    if (active.data.current?.type === 'column') {
      handleColumnDragEnd(active.id as string, over.id as string);
      return;
    }
    handleTaskDragEnd(event);
  }

  function handleColumnDragEnd(activeId: string, overId: string) {
    if (activeId === overId) return;
    const cols = project?.columns ?? [];
    const oldIndex = cols.findIndex((c) => c.id === activeId);
    const newIndex = cols.findIndex((c) => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update: reorder columns in the project query cache immediately.
    const reordered = arrayMove(cols, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }));
    queryClient.setQueryData<Project>(['project', params.projectId], (old) =>
      old ? { ...old, columns: reordered } : old,
    );

    reorderColumnMutation.mutate({ columnId: activeId, position: newIndex });
  }

  function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = (tasks ?? []).find((t) => t.id === taskId);
    if (!task) return;

    // over.id is a task id, a column's zone droppable (`zone:<columnId>`),
    // or the column sortable itself — resolve to a column id in all cases.
    const overTask = (tasks ?? []).find((t) => t.id === over.id);
    const targetColumnId =
      overTask?.columnId ??
      (over.data.current?.columnId as string | undefined) ??
      (over.id as string);

    const targetColumn = project?.columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) return;

    const columnTasks = tasksByColumn.get(targetColumnId) ?? [];
    const newPosition = overTask
      ? columnTasks.findIndex((t) => t.id === overTask.id)
      : columnTasks.length;

    const status = STATUS_BY_COLUMN_NAME[targetColumn.name] ?? task.status;

    queryClient.setQueryData<Task[]>(['tasks', params.projectId], (old) =>
      (old ?? []).map((t) =>
        t.id === taskId ? { ...t, columnId: targetColumnId, position: newPosition, status } : t,
      ),
    );
    flashColumn(targetColumnId);
    moveMutation.mutate({ taskId, columnId: targetColumnId, position: newPosition, status });
  }

  return (
    <main className="relative flex h-screen flex-col">
      <MeshBackground />
      <header className="relative z-10 flex items-center gap-3 border-b border-border px-6 py-4 sm:px-8">
        <Link href={`/org/${params.orgId}`} className="text-sm font-medium text-muted hover:text-ink">
          ← {activeOrganization?.name}
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-display font-bold text-ink">{project?.name}</h1>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks…"
              className="w-44 rounded-lg border border-border bg-surface py-1.5 pl-8 pr-7 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-lg leading-none text-muted hover:text-ink"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => setShowActivity((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              showActivity
                ? 'border-violet bg-violet/10 text-violet'
                : 'border-border text-muted hover:text-ink'
            }`}
          >
            Activity
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 gap-4 overflow-x-auto p-6 sm:p-8">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext
            items={(project?.columns ?? []).map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {project?.columns.map((column, idx) => (
              <BoardColumn
                key={column.id}
                column={column}
                index={idx}
                tasks={tasksByColumn.get(column.id) ?? []}
                justUpdated={recentlyUpdatedColumn === column.id}
                searchQuery={debouncedQuery}
                onCreateTask={(columnId, title) => createMutation.mutate({ columnId, title })}
                onDeleteTask={(taskId) => deleteMutation.mutate(taskId)}
                onOpenTask={(task) => setOpenTask(task)}
                onRename={(columnId, name) => renameColumnMutation.mutate({ columnId, name })}
                onDelete={handleDeleteColumn}
              />
            ))}
          </SortableContext>

          <AddColumnButton onAdd={(name) => addColumnMutation.mutate(name)} />

          <DragOverlay>
            {activeColumn ? (
              <div className="glass flex w-72 shrink-0 flex-col rounded-2xl shadow-card opacity-90 rotate-1">
                <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
                  <span className="h-2 w-2 rounded-full bg-muted" />
                  <h3 className="text-sm font-semibold text-ink">{activeColumn.name}</h3>
                </div>
              </div>
            ) : activeTask ? (
              <TaskCard task={activeTask} onDelete={() => {}} onOpen={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {openTask && (
        <TaskDetailModal
          task={openTask}
          orgId={params.orgId}
          onClose={() => setOpenTask(null)}
          onSave={(updates) => updateMutation.mutate({ taskId: openTask.id, ...updates })}
        />
      )}

      {showActivity && (
        <ActivityPanel
          projectId={params.projectId}
          onClose={() => setShowActivity(false)}
        />
      )}
    </main>
  );
}

function AddColumnButton({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function submit() {
    if (name.trim()) onAdd(name.trim());
    setName('');
    setAdding(false);
  }

  if (adding) {
    return (
      <div className="glass flex w-64 shrink-0 flex-col gap-2 rounded-2xl p-3 shadow-card">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') { setName(''); setAdding(false); }
          }}
          placeholder="Column name…"
          className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 rounded-lg bg-violet py-1.5 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
          >
            Add
          </button>
          <button
            onClick={() => { setName(''); setAdding(false); }}
            className="flex-1 rounded-lg border border-border py-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="glass flex h-12 w-64 shrink-0 items-center justify-center gap-2 rounded-2xl text-sm font-medium text-muted shadow-card transition-colors hover:text-ink"
    >
      + Add column
    </button>
  );
}
