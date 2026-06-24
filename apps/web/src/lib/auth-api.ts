import { api } from './api-client';
import type { AuthResponse } from '@/types';

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function registerRequest(payload: {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}
