import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PersonStatus } from '@prisma/client';
import {
  CreatePersonPublicDto,
  CreatePersonInternalDto,
  UpdatePersonDto,
  ApprovePersonDto,
} from './dto/person.dto';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, requestUser: any, query: any = {}) {
    const where: any = requestUser.isAdmin ? {} : { companyId };

    if (query.status) where.status = query.status as PersonStatus;
    if (query.regionId) where.regionId = query.regionId;
    if (query.registrationType) where.registrationType = query.registrationType;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { cpf: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { instagramUsername: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.person.findMany({
      where,
      include: {
        region: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } },
        _count: { select: { personMissions: true, instagramPosts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
        region: true,
        user: { select: { id: true, email: true, profile: { select: { id: true, name: true } } } },
        leaderships: { include: { region: true } },
        personMissions: {
          include: { mission: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        weeklyPayments: { orderBy: { createdAt: 'desc' }, take: 8 },
        _count: { select: { instagramPosts: true, personMissions: true } },
      },
    });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return person;
  }

  // Cadastro público (qualquer pessoa pode se registrar)
  async registerPublic(dto: CreatePersonPublicDto) {
    if (dto.cpf) {
      const existing = await this.prisma.person.findUnique({ where: { cpf: dto.cpf } });
      if (existing) throw new ConflictException('CPF already registered');
    }

    return this.prisma.person.create({
      data: {
        ...dto,
        registrationType: 'PUBLIC',
        status: 'PENDING' as PersonStatus,
      },
    });
  }

  // Cadastro interno (lideranças cadastram)
  async createInternal(dto: CreatePersonInternalDto) {
    if (dto.cpf) {
      const existing = await this.prisma.person.findUnique({ where: { cpf: dto.cpf } });
      if (existing) throw new ConflictException('CPF already registered');
    }

    return this.prisma.person.create({
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        registrationType: 'INTERNAL',
        status: (dto.status || 'ACTIVE') as PersonStatus,
        activatedAt: dto.status === 'ACTIVE' ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdatePersonDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    return this.prisma.person.update({
      where: { id },
      data,
      include: { region: true },
    });
  }

  async approve(id: string, dto: ApprovePersonDto) {
    await this.findOne(id);
    const data: any = {
      status: dto.status as PersonStatus,
      regionId: dto.regionId,
    };
    if (dto.status === 'ACTIVE') data.activatedAt = new Date();

    return this.prisma.person.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.person.delete({ where: { id } });
  }

  async getStats(companyId: string) {
    const [total, active, pending, suspended] = await Promise.all([
      this.prisma.person.count({ where: { companyId } }),
      this.prisma.person.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.person.count({ where: { companyId, status: 'PENDING' } }),
      this.prisma.person.count({ where: { companyId, status: 'SUSPENDED' } }),
    ]);
    return { total, active, pending, suspended, inactive: total - active - pending - suspended };
  }
}
