import { api } from './api-client';
import type { Comment } from '@/types';

const base = (projectId: string, taskId: string) =>
  `/projects/${projectId}/tasks/${taskId}/comments`;

export async function fetchComments(projectId: string, taskId: string): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(base(projectId, taskId));
  return data;
}

export async function createComment(
  projectId: string,
  taskId: string,
  body: string,
): Promise<Comment> {
  const { data } = await api.post<Comment>(base(projectId, taskId), { body });
  return data;
}

export async function deleteComment(
  projectId: string,
  taskId: string,
  commentId: string,
): Promise<void> {
  await api.delete(`${base(projectId, taskId)}/${commentId}`);
}
