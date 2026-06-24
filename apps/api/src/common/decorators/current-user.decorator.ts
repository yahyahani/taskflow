import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/auth.types';

// Usage: findAll(@CurrentUser() user: AuthenticatedRequest['user'])
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return req.user;
});
