import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedRequest } from '../types/auth.types';

/**
 * Runs AFTER JwtAuthGuard. Reads the `x-organization-id` header, confirms
 * the authenticated user actually has a Membership row for that org, and
 * attaches { organizationId, role } to the request as `req.tenant`.
 *
 * Every tenant-scoped query in the app should read req.tenant.organizationId
 * rather than trusting any organizationId that might appear in a request
 * body — that's what prevents one tenant from reading another tenant's data
 * by simply changing an ID in the payload.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const organizationId = req.headers['x-organization-id'] as string | undefined;
    if (!organizationId) {
      throw new ForbiddenException('Missing x-organization-id header');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    req.tenant = {
      organizationId,
      role: membership.role,
    };

    return true;
  }
}
