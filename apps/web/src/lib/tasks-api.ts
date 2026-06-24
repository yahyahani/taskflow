import { api } from './api-client';
import type { Task, TaskStatus } from '@/types';

export async function fetchTasks(projectId: string): Promise<Task[]> {
  const { data } = await api.get<Task[]>(`/projects/${projectId}/tasks`);
  return data;
}

export async function createTask(
  projectId: string,
  payload: { title: string; columnId: string; description?: string },
): Promise<Task> {
  const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, payload);
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
