import { api } from './api-client';
import type { Activity } from '@/types';

export async function fetchActivities(projectId: string): Promise<Activity[]> {
  const { data } = await api.get<Activity[]>(`/projects/${projectId}/activities`);
  return data;
}
