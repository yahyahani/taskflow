import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
import { AuthenticatedRequest } from '../common/types/auth.types';

@Controller('projects/:projectId/tasks/:taskId/comments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findAll(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.commentsService.findAll(tenant.organizationId, projectId, taskId);
  }

  @Post()
  create(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(tenant.organizationId, projectId, taskId, user.id, dto);
  }

  @Delete(':commentId')
  remove(
    @CurrentTenant() tenant: AuthenticatedRequest['tenant'],
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.remove(
      tenant.organizationId,
      projectId,
      taskId,
      commentId,
      user.id,
    );
  }
}
