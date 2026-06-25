import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommentDto } from './dto/comment.dto';

const AUTHOR_SELECT = { select: { id: true, name: true, email: true } } as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, projectId: string, taskId: string) {
    await this.assertTaskInOrg(organizationId, projectId, taskId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { author: AUTHOR_SELECT },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    organizationId: string,
    projectId: string,
    taskId: string,
    userId: string,
    dto: CreateCommentDto,
  ) {
    await this.assertTaskInOrg(organizationId, projectId, taskId);
    return this.prisma.comment.create({
      data: { body: dto.body, taskId, authorId: userId },
      include: { author: AUTHOR_SELECT },
    });
  }

  async remove(
    organizationId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ) {
    await this.assertTaskInOrg(organizationId, projectId, taskId);
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.taskId !== taskId) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  private async assertTaskInOrg(organizationId: string, projectId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId, project: { organizationId } },
    });
    if (!task) throw new NotFoundException('Task not found');
  }
}
