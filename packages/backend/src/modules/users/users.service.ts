import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, requestUser: any) {
    // Super admin can see all; company admin only their company
    const where: any = requestUser.isAdmin ? {} : { companyId };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, isActive: true, lastLoginAt: true, createdAt: true,
        company: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true } },
        person: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true,
        company: { select: { id: true, name: true } },
        profile: {
          select: {
            id: true, name: true,
            permissions: { include: { permission: true } },
          },
        },
        person: true,
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
      select: {
        id: true, email: true, isActive: true, createdAt: true,
        company: { select: { id: true, name: true } },
        profile: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, isActive: true, updatedAt: true,
        profile: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
