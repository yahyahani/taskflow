import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BoardGateway } from '../websockets/board.gateway';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './dto/task.dto';

// Shared include shape so every response (list, create, update, move)
// returns the same fully-hydrated task — assignee and labels included.
const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true } },
  labels: { include: { label: true } },
} as const;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardGateway: BoardGateway,
  ) {}

  async findAllForProject(organizationId: string, projectId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId, project: { organizationId } },
      include: TASK_INCLUDE,
      orderBy: { position: 'asc' },
    });
    return tasks.map(this.flattenLabels);
  }

  async search(organizationId: string, projectId: string, q: string) {
    await this.assertProjectInOrg(organizationId, projectId);
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        project: { organizationId },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: TASK_INCLUDE,
      orderBy: { position: 'asc' },
    });
    return tasks.map(this.flattenLabels);
  }

  async create(organizationId: string, projectId: string, userId: string, dto: CreateTaskDto) {
    await this.assertProjectInOrg(organizationId, projectId);
    if (dto.assigneeId) await this.assertUserInOrg(organizationId, dto.assigneeId);
    if (dto.labelIds?.length) await this.assertLabelsInOrg(organizationId, dto.labelIds);

    // Verify the column belongs to this project so a client can't mix column
    // and project IDs from different projects within the same org.
    const column = await this.prisma.boardColumn.findFirst({
      where: { id: dto.columnId, projectId },
    });
    if (!column) throw new NotFoundException('Column not found in this project');

    // Scope the position query to this org so cross-tenant columnId probes
    // cannot influence position numbering.
    const lastTask = await this.prisma.task.findFirst({
      where: {
        columnId: dto.columnId,
        column: { project: { organizationId } },
      },
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
        priority: dto.priority,
        position: (lastTask?.position ?? -1) + 1,
        labels: dto.labelIds?.length
          ? { create: dto.labelIds.map((labelId) => ({ labelId })) }
          : undefined,
        activities: {
          create: { type: 'TASK_CREATED', userId },
        },
      },
      include: TASK_INCLUDE,
    });

    const flattened = this.flattenLabels(task);
    this.boardGateway.emitTaskCreated(organizationId, flattened);
    return flattened;
  }

  async update(organizationId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
    await this.assertTaskInOrg(organizationId, taskId);
    if (dto.assigneeId) await this.assertUserInOrg(organizationId, dto.assigneeId);
    if (dto.labelIds?.length) await this.assertLabelsInOrg(organizationId, dto.labelIds);
    const { labelIds, dueDate, ...rest } = dto;

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        // Support explicit null to clear the date; undefined means "don't touch".
        ...(dueDate !== undefined && {
          dueDate: dueDate === null ? null : new Date(dueDate),
        }),
        // Replace the label set entirely when labelIds is provided —
        // simplest semantics for a "save these labels" UI action.
        labels: labelIds
          ? {
              deleteMany: {},
              create: labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
        activities: { create: { type: 'TASK_UPDATED', userId } },
      },
      include: TASK_INCLUDE,
    });

    const flattened = this.flattenLabels(task);
    this.boardGateway.emitTaskUpdated(organizationId, flattened);
    return flattened;
  }

  /**
   * Moves a task to a new column/position (drag-and-drop) and updates its
   * status accordingly. Broadcasts the change so every other connected
   * client redraws the board without polling.
   */
  async move(organizationId: string, taskId: string, userId: string, dto: MoveTaskDto) {
    const existing = await this.assertTaskInOrg(organizationId, taskId);

    const column = await this.prisma.boardColumn.findFirst({
      where: { id: dto.columnId, projectId: existing.projectId },
    });
    if (!column) throw new NotFoundException('Column not found in this project');

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: dto.columnId,
        position: dto.position,
        status: dto.status,
        activities: {
          create: {
            type: 'TASK_MOVED',
            userId,
            metadata: { columnId: dto.columnId, columnName: column.name },
          },
        },
      },
      include: TASK_INCLUDE,
    });

    const flattened = this.flattenLabels(task);
    this.boardGateway.emitTaskMoved(organizationId, flattened);
    return flattened;
  }

  async remove(organizationId: string, taskId: string) {
    // deleteMany lets us check org membership and delete in one query.
    const deleted = await this.prisma.task.deleteMany({
      where: { id: taskId, project: { organizationId } },
    });
    if (deleted.count === 0) throw new NotFoundException('Task not found');
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
    // Return 404 in both cases — "not found" and "belongs to another org" —
    // to avoid leaking whether the ID exists at all (consistent with the
    // same principle applied throughout the rest of the API).
    if (!task || task.project.organizationId !== organizationId) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private async assertUserInOrg(organizationId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) throw new BadRequestException('Assignee is not a member of this organization');
  }

  private async assertLabelsInOrg(organizationId: string, labelIds: string[]) {
    if (labelIds.length === 0) return;
    const found = await this.prisma.label.findMany({
      where: { id: { in: labelIds }, organizationId },
      select: { id: true },
    });
    if (found.length !== labelIds.length) {
      throw new BadRequestException('One or more labels do not belong to this organization');
    }
  }

  // Prisma returns labels as a join-table array (`{ label: {...} }[]`) —
  // flatten that into a plain `Label[]` so the frontend doesn't need to
  // know about the join table shape.
  private flattenLabels<T extends { labels: { label: unknown }[] }>(
    task: T,
  ): Omit<T, 'labels'> & { labels: unknown[] } {
    return { ...task, labels: task.labels.map((l) => l.label) };
  }
}
