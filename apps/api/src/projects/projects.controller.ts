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

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { ProjectsService } from './projects.service';
import { CreateColumnDto, CreateProjectDto, RenameColumnDto, ReorderColumnDto, UpdateProjectDto } from './dto/project.dto';
import { AuthenticatedRequest } from '../common/types/auth.types';

@Controller('projects')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentTenant() tenant: AuthenticatedRequest['tenant']) {
    return this.projectsService.findAll(tenant.organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('id') id: string,
  ) {
    return this.projectsService.findOne(tenant.organizationId, id);
  }

  @Post()
  create(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(tenant.organizationId, dto);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  update(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(tenant.organizationId, id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  remove(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('id') id: string,
  ) {
    return this.projectsService.remove(tenant.organizationId, id);
  }

  @Post(':projectId/columns')
  @Roles('OWNER', 'ADMIN')
  addColumn(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.projectsService.addColumn(tenant.organizationId, projectId, dto.name);
  }

  @Patch(':projectId/columns/:columnId')
  @Roles('OWNER', 'ADMIN')
  renameColumn(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('projectId') projectId: string,
    @Param('columnId') columnId: string,
    @Body() dto: RenameColumnDto,
  ) {
    return this.projectsService.renameColumn(tenant.organizationId, projectId, columnId, dto.name);
  }

  @Delete(':projectId/columns/:columnId')
  @Roles('OWNER', 'ADMIN')
  removeColumn(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('projectId') projectId: string,
    @Param('columnId') columnId: string,
  ) {
    return this.projectsService.removeColumn(tenant.organizationId, projectId, columnId);
  }

  @Get(':id/activities')
  getActivities(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('id') id: string,
  ) {
    return this.projectsService.getActivities(tenant.organizationId, id);
  }

  @Patch(':projectId/columns/:columnId/reorder')
  reorderColumn(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('projectId') projectId: string,
    @Param('columnId') columnId: string,
    @Body() dto: ReorderColumnDto,
  ) {
    return this.projectsService.reorderColumn(
      tenant.organizationId,
      projectId,
      columnId,
      dto.position,
    );
  }
}
