import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BoardGateway } from '../websockets/board.gateway';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardGateway: BoardGateway,
  ) {}

  findAll(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async findOne(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: { columns: { orderBy: { position: 'asc' } } },
    });

    // Returning 404 (not 403) when the project belongs to another org —
    // this avoids leaking whether the ID exists at all to someone probing.
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(organizationId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        organizationId,
        columns: {
          create: DEFAULT_COLUMNS.map((name, index) => ({ name, position: index })),
        },
      },
      include: { columns: true },
    });
  }

  async update(organizationId: string, projectId: string, dto: UpdateProjectDto) {
    await this.assertBelongsToOrg(organizationId, projectId);
    return this.prisma.project.update({ where: { id: projectId }, data: dto });
  }

  async remove(organizationId: string, projectId: string) {
    await this.assertBelongsToOrg(organizationId, projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }

  async reorderColumn(
    organizationId: string,
    projectId: string,
    columnId: string,
    newPosition: number,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    const column = project.columns.find((c) => c.id === columnId);
    if (!column) throw new NotFoundException('Column not found');

    // Remove from current position, insert at new position, then persist all
    // updated indices in one transaction so positions are always consistent.
    const rest = project.columns.filter((c) => c.id !== columnId);
    const clamped = Math.max(0, Math.min(newPosition, rest.length));
    rest.splice(clamped, 0, column);

    await this.prisma.$transaction(
      rest.map((col, idx) =>
        this.prisma.boardColumn.update({ where: { id: col.id }, data: { position: idx } }),
      ),
    );

    const reordered = rest.map((col, idx) => ({ ...col, position: idx }));
    this.boardGateway.emitColumnReordered(organizationId, reordered);
    return reordered;
  }

  async getActivities(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.activity.findMany({
      where: { task: { projectId, project: { organizationId } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  // Defense in depth: even though routes are guarded, every mutation
  // re-verifies the row actually belongs to the caller's org before
  // touching it, in case a projectId from another tenant is passed in.
  private async assertBelongsToOrg(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
  }
}
