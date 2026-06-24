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
import { fetchProject } from '@/lib/projects-api';
import { createTask, deleteTask, fetchTasks, moveTask } from '@/lib/tasks-api';
import { useAuthStore } from '@/store/auth.store';
import { useBoardSocket } from '@/lib/use-board-socket';
import { BoardColumn } from '@/components/BoardColumn';
import { TaskCard } from '@/components/TaskCard';
import type { Task, TaskStatus } from '@/types';

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
  const user = useAuthStore((s) => s.user);
  const activeOrganization = useAuthStore((s) => s.activeOrganization);
  const queryClient = useQueryClient();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [recentlyUpdatedColumn, setRecentlyUpdatedColumn] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

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

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks ?? []) {
      const list = map.get(task.columnId) ?? [];
      list.push(task);
      map.set(task.columnId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [tasks]);

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

  function handleDragStart(event: DragStartEvent) {
    const task = (tasks ?? []).find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = (tasks ?? []).find((t) => t.id === taskId);
    if (!task) return;

    // `over.id` is either a column id (dropped on empty column space) or
    // another task's id (dropped on/between cards) — resolve to a column
    // either way.
    const overTask = (tasks ?? []).find((t) => t.id === over.id);
    const targetColumnId = overTask ? overTask.columnId : (over.id as string);
    const targetColumn = project?.columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) return;

    const columnTasks = tasksByColumn.get(targetColumnId) ?? [];
    const newPosition = overTask
      ? columnTasks.findIndex((t) => t.id === overTask.id)
      : columnTasks.length;

    const status = STATUS_BY_COLUMN_NAME[targetColumn.name] ?? task.status;

    // Optimistic update: move the card immediately, reconcile with the
    // server response (and with whatever the socket broadcasts back) after.
    queryClient.setQueryData<Task[]>(['tasks', params.projectId], (old) =>
      (old ?? []).map((t) =>
        t.id === taskId ? { ...t, columnId: targetColumnId, position: newPosition, status } : t,
      ),
    );
    flashColumn(targetColumnId);

    moveMutation.mutate({ taskId, columnId: targetColumnId, position: newPosition, status });
  }

  return (
    <main className="flex h-screen flex-col bg-base">
      <header className="flex items-center gap-3 border-b border-border px-8 py-4">
        <Link href={`/org/${params.orgId}`} className="text-sm text-muted hover:text-ink">
          ← {activeOrganization?.name}
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-display font-semibold text-ink">{project?.name}</h1>
      </header>

      <div className="flex flex-1 gap-4 overflow-x-auto p-8">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {project?.columns.map((column, idx) => (
            <BoardColumn
              key={column.id}
              column={column}
              index={idx}
              tasks={tasksByColumn.get(column.id) ?? []}
              justUpdated={recentlyUpdatedColumn === column.id}
              onCreateTask={(columnId, title) => createMutation.mutate({ columnId, title })}
              onDeleteTask={(taskId) => deleteMutation.mutate(taskId)}
            />
          ))}

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} onDelete={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
}
