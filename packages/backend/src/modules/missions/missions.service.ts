import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMissionDto, UpdateMissionDto, ValidateMissionDto } from './dto/mission.dto';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, requestUser: any) {
    const where: any = requestUser.isAdmin ? {} : { companyId };
    return this.prisma.mission.findMany({
      where,
      include: { _count: { select: { personMissions: true } } },
      orderBy: [{ isRequired: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const m = await this.prisma.mission.findUnique({
      where: { id },
      include: {
        _count: { select: { personMissions: true } },
        personMissions: {
          where: { status: 'COMPLETED' },
          include: { person: { select: { id: true, firstName: true, lastName: true } } },
          take: 10,
          orderBy: { completedAt: 'desc' },
        },
      },
    });
    if (!m) throw new NotFoundException(`Mission ${id} not found`);
    return m;
  }

  async create(dto: CreateMissionDto) {
    return this.prisma.mission.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateMissionDto) {
    await this.findOne(id);
    return this.prisma.mission.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mission.delete({ where: { id } });
  }

  // Get weekly missions for a specific person
  async getWeeklyMissions(personId: string, weekNumber?: number, year?: number) {
    const now = new Date();
    const week = weekNumber || this.getWeekNumber(now);
    const yr = year || now.getFullYear();

    // Get person's company
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException('Person not found');

    const missions = await this.prisma.mission.findMany({
      where: { companyId: person.companyId, isActive: true },
    });

    const personMissions = await this.prisma.personMission.findMany({
      where: { personId, weekNumber: week, year: yr },
      include: { mission: true },
    });

    return {
      weekNumber: week,
      year: yr,
      missions: missions.map((m) => {
        const pm = personMissions.find((pm) => pm.missionId === m.id);
        return {
          ...m,
          personMission: pm || null,
          completed: pm?.status === 'COMPLETED',
        };
      }),
      completedCount: personMissions.filter((pm) => pm.status === 'COMPLETED').length,
      totalCount: missions.length,
    };
  }

  // Validate/complete a mission for a person
  async validateMission(dto: ValidateMissionDto) {
    const mission = await this.prisma.mission.findUnique({ where: { id: dto.missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    const existing = await this.prisma.personMission.findUnique({
      where: {
        personId_missionId_weekNumber_year: {
          personId: dto.personId,
          missionId: dto.missionId,
          weekNumber: dto.weekNumber,
          year: dto.year,
        },
      },
    });

    if (existing) {
      return this.prisma.personMission.update({
        where: { id: existing.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          evidence: dto.evidence,
          notes: dto.notes,
          points: mission.points,
        },
      });
    }

    const pm = await this.prisma.personMission.create({
      data: {
        personId: dto.personId,
        missionId: dto.missionId,
        weekNumber: dto.weekNumber,
        year: dto.year,
        status: 'COMPLETED',
        completedAt: new Date(),
        evidence: dto.evidence,
        notes: dto.notes,
        points: mission.points,
      },
    });

    // Update person total points
    await this.prisma.person.update({
      where: { id: dto.personId },
      data: { totalPoints: { increment: mission.points } },
    });

    // Check if person should level up
    await this.checkLevelUp(dto.personId);

    return pm;
  }

  async getPersonMissions(personId: string, query: any = {}) {
    const where: any = { personId };
    if (query.weekNumber) where.weekNumber = parseInt(query.weekNumber);
    if (query.year) where.year = parseInt(query.year);
    if (query.status) where.status = query.status;

    return this.prisma.personMission.findMany({
      where,
      include: { mission: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async checkLevelUp(personId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) return;

    const params = await this.prisma.salaryParameter.findUnique({
      where: { companyId: person.companyId },
    });
    if (!params) return;

    const pointsForNextLevel = person.level * params.missionPointsToLevel;
    if (person.totalPoints >= pointsForNextLevel) {
      await this.prisma.person.update({
        where: { id: personId },
        data: { level: { increment: 1 } },
      });
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
