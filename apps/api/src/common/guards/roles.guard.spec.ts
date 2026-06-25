import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function buildContext(role: string) {
    const req: { tenant: { organizationId: string; role: string } } = {
      tenant: { organizationId: 'org-1', role },
    };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  it('allows the request through when the route has no @Roles() decorator', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = buildContext('MEMBER');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows the request through when the caller has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);
    const ctx = buildContext('ADMIN');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies the request when the caller lacks any required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);
    const ctx = buildContext('MEMBER');

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
