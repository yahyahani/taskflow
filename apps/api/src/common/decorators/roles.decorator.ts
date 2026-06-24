import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Usage: @Roles('OWNER', 'ADMIN') above a controller method.
export const Roles = (...roles: Array<'OWNER' | 'ADMIN' | 'MEMBER'>) =>
  SetMetadata(ROLES_KEY, roles);
