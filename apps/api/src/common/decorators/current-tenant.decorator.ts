import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/auth.types';

// Usage: findAll(@CurrentTenant() tenant: AuthenticatedRequest['tenant'])
// Only valid on routes guarded by TenantGuard — otherwise req.tenant is undefined.
export const CurrentTenant = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return req.tenant;
});
