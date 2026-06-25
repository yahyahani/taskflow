import { api } from './api-client';
import type { Label } from '@/types';

export async function fetchLabels(): Promise<Label[]> {
  const { data } = await api.get<Label[]>('/labels');
  return data;
}

export async function createLabel(payload: { name: string; color: string }): Promise<Label> {
  const { data } = await api.post<Label>('/labels', payload);
  return data;
}

export async function deleteLabel(labelId: string): Promise<void> {
  await api.delete(`/labels/${labelId}`);
}
