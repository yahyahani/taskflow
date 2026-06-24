import { api } from './api-client';
import type { Project } from '@/types';

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
