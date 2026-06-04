import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadershipDto, UpdateLeadershipDto } from './dto/leadership.dto';

@Injectable()
export class LeadershipService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, requestUser: any) {
    const where: any = requestUser.isAdmin
      ? {}
      : { region: { companyId } };

    return this.prisma.leadership.findMany({
      where,
      include: {
        region: { select: { id: true, name: true } },
        person: { select: { id: true, firstName: true, lastName: true, phone: true, instagramUsername: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findByRegion(regionId: string) {
    return this.prisma.leadership.findMany({
      where: { regionId, isActive: true },
      include: {
        person: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });
  }

  async findOne(id: string) {
    const l = await this.prisma.leadership.findUnique({
      where: { id },
      include: {
        region: true,
        person: true,
      },
    });
    if (!l) throw new NotFoundException(`Leadership ${id} not found`);
    return l;
  }

  async create(dto: CreateLeadershipDto) {
    return this.prisma.leadership.create({
      data: {
        ...dto,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: {
        region: { select: { id: true, name: true } },
        person: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateLeadershipDto) {
    await this.findOne(id);
    return this.prisma.leadership.update({
      where: { id },
      data: {
        ...dto,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.leadership.update({
      where: { id },
      data: { isActive: false, endDate: new Date() },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.leadership.delete({ where: { id } });
  }
}
