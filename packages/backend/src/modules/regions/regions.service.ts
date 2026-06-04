import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, requestUser: any) {
    const where: any = requestUser.isAdmin ? {} : { companyId };
    return this.prisma.region.findMany({
      where,
      include: {
        _count: { select: { persons: true, leaderships: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        leaderships: {
          where: { isActive: true },
          include: { person: { select: { id: true, firstName: true, lastName: true } } },
        },
        _count: { select: { persons: true } },
      },
    });
    if (!region) throw new NotFoundException(`Region ${id} not found`);
    return region;
  }

  async create(dto: CreateRegionDto) {
    return this.prisma.region.create({ data: dto });
  }

  async update(id: string, dto: UpdateRegionDto) {
    await this.findOne(id);
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.region.delete({ where: { id } });
  }
}
