import { api } from './api-client';
import type { Membership, Organization } from '@/types';

export async function fetchMyOrganizations(): Promise<Membership[]> {
  const { data } = await api.get<Membership[]>('/organizations/mine');
  return data;
}

export async function createOrganization(name: string): Promise<Organization> {
  const { data } = await api.post<Organization>('/organizations', { name });
  return data;
}
