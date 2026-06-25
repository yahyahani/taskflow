import { api } from './api-client';
import type { BoardColumn, Project } from '@/types';

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects');
  return data;
}

export async function fetchProject(projectId: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${projectId}`);
  return data;
}

export async function createProject(payload: {
  name: string;
  description?: string;
}): Promise<Project> {
  const { data } = await api.post<Project>('/projects', payload);
  return data;
}

export async function addColumn(projectId: string, name: string): Promise<BoardColumn> {
  const { data } = await api.post<BoardColumn>(`/projects/${projectId}/columns`, { name });
  return data;
}

export async function renameColumn(
  projectId: string,
  columnId: string,
  name: string,
): Promise<BoardColumn> {
  const { data } = await api.patch<BoardColumn>(
    `/projects/${projectId}/columns/${columnId}`,
    { name },
  );
  return data;
}

export async function deleteColumn(projectId: string, columnId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/columns/${columnId}`);
}

export async function reorderColumn(
  projectId: string,
  columnId: string,
  position: number,
): Promise<BoardColumn[]> {
  const { data } = await api.patch<BoardColumn[]>(
    `/projects/${projectId}/columns/${columnId}/reorder`,
    { position },
  );
  return data;
}
