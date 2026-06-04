import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { isActive?: boolean; search?: string } = {}) {
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { cnpj: { contains: query.search } },
      ];
    }

    return this.prisma.company.findMany({
      where,
      include: {
        _count: { select: { users: true, persons: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        profiles: { include: { _count: { select: { users: true } } } },
        _count: { select: { users: true, persons: true, regions: true } },
        parameters: true,
      },
    });

    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async create(dto: CreateCompanyDto) {
    if (dto.cnpj) {
      const existing = await this.prisma.company.findUnique({ where: { cnpj: dto.cnpj } });
      if (existing) throw new ConflictException('Company with this CNPJ already exists');
    }

    const company = await this.prisma.company.create({ data: dto });

    // Auto-create default profiles and salary parameters for new company
    await this.createDefaultProfilesForCompany(company.id);
    await this.prisma.salaryParameter.create({
      data: {
        companyId: company.id,
        monthlyBaseSalary: 1000,
        weeklyAmount: 250,
        weeksPerMonth: 4,
        levelBonusPercentage: 10,
        missionPointsToLevel: 100,
        missionsRequiredPerWeek: 3,
      },
    });

    // Auto-create default missions with default reward values (R$ 50.00)
    const defaultMissions = [
      {
        name: 'Publicar Foto',
        description: 'Publique uma foto no Instagram da empresa',
        type: 'POST_PHOTO',
        points: 25,
        isRequired: true,
        rewardValue: 50.00,
      },
      {
        name: 'Marcar a Empresa',
        description: 'Marque o perfil da empresa na publicação',
        type: 'TAG_COMPANY',
        points: 25,
        isRequired: true,
        rewardValue: 50.00,
      },
      {
        name: 'Comentar na Publicação',
        description: 'Faça um comentário na publicação da empresa',
        type: 'COMMENT_POST',
        points: 25,
        isRequired: true,
        rewardValue: 50.00,
      },
      {
        name: 'Compartilhar Publicação',
        description: 'Compartilhe a publicação da empresa',
        type: 'SHARE_POST',
        points: 25,
        isRequired: false,
        rewardValue: 50.00,
      },
    ];

    for (const mission of defaultMissions) {
      await this.prisma.mission.create({
        data: {
          companyId: company.id,
          ...mission,
          type: mission.type as any,
        },
      });
    }

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const company = await this.findOne(id);
    if (company.isAdmin) throw new ConflictException('Cannot delete the admin company');
    return this.prisma.company.delete({ where: { id } });
  }

  async activate(id: string) {
    return this.prisma.company.update({ where: { id }, data: { isActive: true } });
  }

  async deactivate(id: string) {
    return this.prisma.company.update({ where: { id }, data: { isActive: false } });
  }

  private async createDefaultProfilesForCompany(companyId: string) {
    // Get all permissions
    const permissions = await this.prisma.permission.findMany();
    const allPermissionIds = permissions.map((p) => p.id);

    const companyAdminPermissions = permissions
      .filter((p) => !['companies:delete', 'companies:manage'].includes(p.name))
      .map((p) => p.id);

    const leaderPermissions = permissions
      .filter((p) =>
        ['persons:read', 'persons:create', 'persons:update', 'persons:approve',
         'regions:read', 'leadership:read', 'missions:read', 'missions:validate',
         'salary:read', 'instagram:read', 'reports:read'].includes(p.name),
      )
      .map((p) => p.id);

    const employeePermissions = permissions
      .filter((p) => ['missions:read', 'salary:read', 'instagram:read'].includes(p.name))
      .map((p) => p.id);

    const profilesData = [
      { name: 'COMPANY_ADMIN', description: 'Administrador da Empresa', permIds: companyAdminPermissions },
      { name: 'LEADER', description: 'Liderança Regional', permIds: leaderPermissions },
      { name: 'EMPLOYEE', description: 'Funcionário', permIds: employeePermissions },
    ];

    for (const pd of profilesData) {
      const profile = await this.prisma.profile.create({
        data: { name: pd.name, description: pd.description, companyId, isSystem: true },
      });
      for (const permissionId of pd.permIds) {
        await this.prisma.profilePermission.create({
          data: { profileId: profile.id, permissionId },
        });
      }
    }
  }
}
