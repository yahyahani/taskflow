import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let prisma: { membership: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { membership: { findUnique: jest.fn() } };
    guard = new TenantGuard(prisma as unknown as PrismaService);
  });

  function buildContext(headers: Record<string, string>, userId = 'user-1') {
    const req: { headers: Record<string, string>; user: { id: string } } = {
      headers,
      user: { id: userId },
    };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  }

  it('throws if x-organization-id header is missing', async () => {
    const ctx = buildContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(/Missing x-organization-id/);
  });

  it('throws if the user has no membership in the requested organization', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);
    const ctx = buildContext({ 'x-organization-id': 'org-999' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(prisma.membership.findUnique).toHaveBeenCalledWith({
      where: {
        userId_organizationId: { userId: 'user-1', organizationId: 'org-999' },
      },
    });
  });

  it('attaches verified tenant context and allows the request through on a valid membership', async () => {
    prisma.membership.findUnique.mockResolvedValue({ role: 'ADMIN' });
    const req: { headers: Record<string, string>; user: { id: string }; tenant?: unknown } = {
      headers: { 'x-organization-id': 'org-1' },
      user: { id: 'user-1' },
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req.tenant).toEqual({ organizationId: 'org-1', role: 'ADMIN' });
  });

  it('never trusts an organizationId that is not backed by a real membership row', async () => {
    // Even if a clever caller sends an org id that "looks" valid, with no
    // membership row the guard must deny — this is the whole point of the
    // guard existing rather than trusting client-supplied tenant context.
    prisma.membership.findUnique.mockResolvedValue(null);
    const ctx = buildContext({ 'x-organization-id': 'someone-elses-org' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'You are not a member of this organization',
    );
  });
});
