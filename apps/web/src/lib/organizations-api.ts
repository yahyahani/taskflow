import { api } from './api-client';
import type { Member, Membership, Organization } from '@/types';

export async function fetchMyOrganizations(): Promise<Membership[]> {
  const { data } = await api.get<Membership[]>('/organizations/mine');
  return data;
}

export async function createOrganization(name: string): Promise<Organization> {
  const { data } = await api.post<Organization>('/organizations', { name });
  return data;
}

// ── Member management ──────────────────────────────────────────────────────

export async function fetchMembers(orgId: string): Promise<Member[]> {
  const { data } = await api.get<Member[]>(`/organizations/${orgId}/members`);
  return data;
}

export async function inviteMember(
  orgId: string,
  email: string,
  role: string = 'MEMBER',
): Promise<Member> {
  const { data } = await api.post<Member>(`/organizations/${orgId}/members/invite`, {
    email,
    role,
  });
  return data;
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: string,
): Promise<Member> {
  const { data } = await api.patch<Member>(`/organizations/${orgId}/members/${userId}`, { role });
  return data;
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  await api.delete(`/organizations/${orgId}/members/${userId}`);
}
