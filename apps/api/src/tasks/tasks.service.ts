import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BoardGateway } from '../websockets/board.gateway';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardGateway: BoardGateway,
  ) {}

  findAllForProject(organizationId: string, projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId, project: { organizationId } },
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { position: 'asc' },
    });
  }

  async create(organizationId: string, projectId: string, userId: string, dto: CreateTaskDto) {
    await this.assertProjectInOrg(organizationId, projectId);

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { position: 'desc' },
    });

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        columnId: dto.columnId,
        projectId,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        position: (lastTask?.position ?? -1) + 1,
        activities: {
          create: { type: 'TASK_CREATED', userId },
        },
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    this.boardGateway.emitTaskCreated(organizationId, task);
    return task;
  }

  async update(organizationId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
    await this.assertTaskInOrg(organizationId, taskId);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        activities: { create: { type: 'TASK_UPDATED', userId } },
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    this.boardGateway.emitTaskUpdated(organizationId, task);
    return task;
  }

  /**
   * Moves a task to a new column/position (drag-and-drop) and updates its
   * status accordingly. Broadcasts the change so every other connected
   * client redraws the board without polling.
   */
  async move(organizationId: string, taskId: string, userId: string, dto: MoveTaskDto) {
    await this.assertTaskInOrg(organizationId, taskId);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: dto.columnId,
        position: dto.position,
        status: dto.status,
        activities: {
          create: { type: 'TASK_MOVED', userId, metadata: { columnId: dto.columnId } },
        },
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    this.boardGateway.emitTaskMoved(organizationId, task);
    return task;
  }

  async remove(organizationId: string, taskId: string) {
    await this.assertTaskInOrg(organizationId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
    this.boardGateway.emitTaskDeleted(organizationId, { id: taskId });
    return { success: true };
  }

  private async assertProjectInOrg(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
  }

  private async assertTaskInOrg(organizationId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.project.organizationId !== organizationId) {
      throw new ForbiddenException('This task does not belong to your organization');
    }
  }
}
