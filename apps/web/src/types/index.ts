export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Membership {
  id: string;
  role: Role;
  organization: Organization;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  dueDate: string | null;
  columnId: string;
  projectId: string;
  assignee: Assignee | null;
  labels: Label[];
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  columns: BoardColumn[];
  _count?: { tasks: number };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  organization?: Organization;
}
