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
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './dto/task.dto';
import { AuthenticatedRequest } from '../common/types/auth.types';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAllForProject(tenant.organizationId, projectId);
  }

  @Post()
  create(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(tenant.organizationId, projectId, user.id, dto);
  }

  @Patch(':taskId')
  update(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(tenant.organizationId, taskId, user.id, dto);
  }

  @Patch(':taskId/move')
  move(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasksService.move(tenant.organizationId, taskId, user.id, dto);
  }

  @Delete(':taskId')
  remove(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.remove(tenant.organizationId, taskId);
  }
}
