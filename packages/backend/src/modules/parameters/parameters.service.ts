import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateParametersDto } from './dto/parameters.dto';

@Injectable()
export class ParametersService {
  constructor(private readonly prisma: PrismaService) {}

  async getParameters(companyId: string) {
    const params = await this.prisma.salaryParameter.findUnique({ where: { companyId } });
    if (!params) {
      // Create default if not exists
      return this.prisma.salaryParameter.create({
        data: {
          companyId,
          monthlyBaseSalary: 1000,
          weeklyAmount: 250,
          weeksPerMonth: 4,
          levelBonusPercentage: 10,
          missionPointsToLevel: 100,
          missionsRequiredPerWeek: 3,
        },
      });
    }
    return params;
  }

  async updateParameters(companyId: string, dto: UpdateParametersDto) {
    return this.prisma.salaryParameter.upsert({
      where: { companyId },
      update: dto,
      create: {
        companyId,
        monthlyBaseSalary: dto.monthlyBaseSalary ?? 1000,
        weeklyAmount: dto.weeklyAmount ?? 250,
        weeksPerMonth: dto.weeksPerMonth ?? 4,
        levelBonusPercentage: dto.levelBonusPercentage ?? 10,
        missionPointsToLevel: dto.missionPointsToLevel ?? 100,
        missionsRequiredPerWeek: dto.missionsRequiredPerWeek ?? 3,
      },
    });
  }
}
