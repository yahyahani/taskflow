import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

const USER_SELECT = { select: { id: true, name: true, email: true } } as const;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findForUser(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, name: string) {
    const slug = this.slugify(name);
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const organization = await tx.organization.create({ data: { name, slug } });
      await tx.membership.create({
        data: { userId, organizationId: organization.id, role: 'OWNER' },
      });
      return organization;
    });
  }

  // ── Member management ───────────────────────────────────────────────────────

  getMembers(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: USER_SELECT },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(organizationId: string, email: string, role: Role = Role.MEMBER) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('No account found with this email address');

    const existing = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
    });
    if (existing) throw new ConflictException('This user is already a member of this organization');

    return this.prisma.membership.create({
      data: { userId: user.id, organizationId, role },
      include: { user: USER_SELECT },
    });
  }

  async updateMemberRole(
    organizationId: string,
    targetUserId: string,
    newRole: Role,
    actorId: string,
    actorRole: Role,
  ) {
    if (targetUserId === actorId) {
      throw new BadRequestException("You can't change your own role");
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    // Only OWNERs may touch OWNER rows or assign the OWNER role.
    if (actorRole !== Role.OWNER && (membership.role === Role.OWNER || newRole === Role.OWNER)) {
      throw new ForbiddenException('Only owners can assign or modify the owner role');
    }

    return this.prisma.membership.update({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
      data: { role: newRole },
      include: { user: USER_SELECT },
    });
  }

  async removeMember(
    organizationId: string,
    targetUserId: string,
    actorId: string,
    actorRole: Role,
  ) {
    if (targetUserId === actorId) {
      throw new BadRequestException("You can't remove yourself from an organization");
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === Role.OWNER) {
      throw new ForbiddenException('The organization owner cannot be removed');
    }

    // ADMINs can only remove MEMBERs; removing another ADMIN requires OWNER.
    if (actorRole !== Role.OWNER && membership.role === Role.ADMIN) {
      throw new ForbiddenException('Only owners can remove admins');
    }

    await this.prisma.membership.delete({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    });
    return { success: true };
  }

  private slugify(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
  }
}
