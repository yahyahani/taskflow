import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/label.dto';
import { AuthenticatedRequest } from '../common/types/auth.types';

@Controller('labels')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get()
  findAll(@CurrentTenant() tenant: AuthenticatedRequest['tenant']) {
    return this.labelsService.findAll(tenant.organizationId);
  }

  @Post()
  create(@CurrentTenant() tenant: AuthenticatedRequest['tenant'], @Body() dto: CreateLabelDto) {
    return this.labelsService.create(tenant.organizationId, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenant: AuthenticatedRequest['tenant'], @Param('id') id: string) {
    return this.labelsService.remove(tenant.organizationId, id);
  }
}
