import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, requestUser: any) {
    const where: any = requestUser.isAdmin ? {} : { companyId };
    return this.prisma.profile.findMany({
      where,
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    if (!profile) throw new NotFoundException(`Profile ${id} not found`);
    return profile;
  }

  async create(dto: CreateProfileDto) {
    const { permissionIds, ...data } = dto;
    const profile = await this.prisma.profile.create({ data });

    if (permissionIds?.length) {
      await this.prisma.profilePermission.createMany({
        data: permissionIds.map((permissionId) => ({ profileId: profile.id, permissionId })),
      });
    }

    return this.findOne(profile.id);
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.findOne(id);
    const { permissionIds, ...data } = dto;

    if (Object.keys(data).length) {
      await this.prisma.profile.update({ where: { id }, data });
    }

    if (permissionIds !== undefined) {
      await this.prisma.profilePermission.deleteMany({ where: { profileId: id } });
      if (permissionIds.length) {
        await this.prisma.profilePermission.createMany({
          data: permissionIds.map((permissionId) => ({ profileId: id, permissionId })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const profile = await this.findOne(id);
    if (profile.isSystem) throw new NotFoundException('Cannot delete system profiles');
    return this.prisma.profile.delete({ where: { id } });
  }
}
