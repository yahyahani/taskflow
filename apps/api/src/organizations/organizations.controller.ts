import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { OrganizationsService } from './organizations.service';
import { AuthenticatedRequest } from '../common/types/auth.types';

class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name: string;
}

class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

class UpdateMemberRoleDto {
  @IsEnum(Role)
  role: Role;
}

// Note: GET /organizations/mine and POST /organizations are NOT behind
// TenantGuard — those actions happen before a tenant context exists.
// The member-management routes below require TenantGuard + RolesGuard
// applied at the method level (they combine with the class-level JwtAuthGuard).
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedRequest['user']) {
    return this.organizationsService.findForUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, dto.name);
  }

  // ── Member management (tenant-scoped) ────────────────────────────────────

  @Get(':orgId/members')
  @UseGuards(TenantGuard)
  getMembers(@CurrentTenant() tenant: AuthenticatedRequest['tenant']) {
    return this.organizationsService.getMembers(tenant.organizationId);
  }

  @Post(':orgId/members/invite')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  inviteMember(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(tenant.organizationId, dto.email, dto.role);
  }

  @Patch(':orgId/members/:userId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  updateMemberRole(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(
      tenant.organizationId,
      userId,
      dto.role,
      user.id,
      tenant.role as Role,
    );
  }

  @Delete(':orgId/members/:userId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  removeMember(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.removeMember(
      tenant.organizationId,
      userId,
      user.id,
      tenant.role as Role,
    );
  }
}
