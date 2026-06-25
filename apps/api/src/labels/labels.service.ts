import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateLabelDto } from './dto/label.dto';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.label.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(organizationId: string, dto: CreateLabelDto) {
    return this.prisma.label.create({
      data: { name: dto.name, color: dto.color, organizationId },
    });
  }

  async remove(organizationId: string, labelId: string) {
    const label = await this.prisma.label.findUnique({ where: { id: labelId } });
    if (!label) throw new NotFoundException('Label not found');
    if (label.organizationId !== organizationId) {
      throw new NotFoundException('Label not found');
    }
    await this.prisma.label.delete({ where: { id: labelId } });
    return { success: true };
  }
}
