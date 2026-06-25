import { api } from './api-client';
import type { Priority, Task, TaskStatus } from '@/types';

export async function fetchTasks(projectId: string): Promise<Task[]> {
  const { data } = await api.get<Task[]>(`/projects/${projectId}/tasks`);
  return data;
}

export async function createTask(
  projectId: string,
  payload: {
    title: string;
    columnId: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    labelIds?: string[];
  },
): Promise<Task> {
  const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, payload);
  return data;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  payload: {
    title?: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    priority?: Priority;
    labelIds?: string[];
  },
): Promise<Task> {
  const { data } = await api.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, payload);
  return data;
}

export async function moveTask(
  projectId: string,
  taskId: string,
  payload: { columnId: string; position: number; status: TaskStatus },
): Promise<Task> {
  const { data } = await api.patch<Task>(
    `/projects/${projectId}/tasks/${taskId}/move`,
    payload,
  );
  return data;
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/tasks/${taskId}`);
}

export async function searchTasks(projectId: string, q: string): Promise<Task[]> {
  const { data } = await api.get<Task[]>(`/projects/${projectId}/tasks/search`, { params: { q } });
  return data;
}
