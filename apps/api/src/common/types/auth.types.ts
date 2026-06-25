import type { Request } from 'express';

// Shape of the JWT access-token payload. `organizationId` is intentionally
// NOT included here — a user can belong to multiple orgs, so the active
// org is resolved per-request from the `x-organization-id` header and
// verified against real membership (see TenantGuard). Baking org into the
// token would force a re-login on every org switch.
export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
  tenant: {
    organizationId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
  };
}
