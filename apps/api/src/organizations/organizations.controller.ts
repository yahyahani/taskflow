import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { AuthenticatedRequest } from '../common/types/auth.types';

class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name: string;
}

// Note: these routes are NOT behind TenantGuard. Listing "which orgs do I
// belong to" and "create a new org" happen before a tenant context exists.
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
}
