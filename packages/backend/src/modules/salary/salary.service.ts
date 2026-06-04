import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getPersonSalary(personId: string) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException('Person not found');

    const params = await this.prisma.salaryParameter.findUnique({
      where: { companyId: person.companyId },
    });

    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    const currentYear = now.getFullYear();

    const weeklyPayments = await this.prisma.weeklyPayment.findMany({
      where: { personId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      take: 12,
    });

    const completedMissions = await this.prisma.personMission.findMany({
      where: { personId, weekNumber: currentWeek, year: currentYear, status: 'COMPLETED' },
      include: { mission: true },
    });

    const currentWeekMissions = completedMissions.length;

    const baseWeekly = completedMissions.reduce(
      (sum, pm) => sum + Number(pm.mission.rewardValue || 0),
      0
    );

    const levelBonus = params
      ? Number(params.levelBonusPercentage) * (person.level - 1) / 100
      : 0;

    const bonusAmount = baseWeekly * levelBonus;

    return {
      person: {
        id: person.id,
        name: `${person.firstName} ${person.lastName}`,
        level: person.level,
        totalPoints: person.totalPoints,
      },
      currentWeek: {
        weekNumber: currentWeek,
        year: currentYear,
        missionsCompleted: currentWeekMissions,
        missionsRequired: params?.missionsRequiredPerWeek || 3,
        weeklyBase: baseWeekly,
        levelBonus: bonusAmount,
        weeklyTotal: baseWeekly + bonusAmount,
        eligible: currentWeekMissions > 0,
      },
      monthlyBase: params ? Number(params.monthlyBaseSalary) : 1000,
      payments: weeklyPayments,
    };
  }

  async generateWeeklyPayment(personId: string, weekNumber: number, year: number) {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException('Person not found');

    const params = await this.prisma.salaryParameter.findUnique({
      where: { companyId: person.companyId },
    });

    const completedPersonMissions = await this.prisma.personMission.findMany({
      where: { personId, weekNumber: Number(weekNumber), year: Number(year), status: 'COMPLETED' },
      include: { mission: true },
    });

    const missionsCompleted = completedPersonMissions.length;
    const baseAmount = completedPersonMissions.reduce(
      (sum, pm) => sum + Number(pm.mission.rewardValue || 0),
      0
    );

    const levelBonus = params
      ? baseAmount * (Number(params.levelBonusPercentage) * (person.level - 1) / 100)
      : 0;

    const eligible = baseAmount > 0;

    const wNum = Number(weekNumber);
    const yr = Number(year);

    return this.prisma.weeklyPayment.upsert({
      where: { personId_weekNumber_year: { personId, weekNumber: wNum, year: yr } },
      update: {
        amount: baseAmount,
        bonus: levelBonus,
        total: baseAmount + levelBonus,
        missionsCompleted,
        levelAtTime: person.level,
        status: eligible ? 'APPROVED' : 'CANCELLED',
      },
      create: {
        personId,
        weekNumber: wNum,
        year: yr,
        amount: baseAmount,
        bonus: levelBonus,
        total: baseAmount + levelBonus,
        missionsCompleted,
        levelAtTime: person.level,
        status: eligible ? 'APPROVED' : 'CANCELLED',
      },
    });
  }

  async generateWeeklyPaymentsForCompany(companyId: string, weekNumber: number, year: number) {
    const activePersons = await this.prisma.person.findMany({
      where: { companyId, status: 'ACTIVE' },
    });

    const results = [];
    for (const person of activePersons) {
      const payment = await this.generateWeeklyPayment(person.id, weekNumber, year);
      results.push(payment);
    }
    return results;
  }

  async getCompanySalaryReport(companyId: string, weekNumber?: number, year?: number) {
    const now = new Date();
    const week = weekNumber || this.getWeekNumber(now);
    const yr = year || now.getFullYear();

    const payments = await this.prisma.weeklyPayment.findMany({
      where: {
        weekNumber: week,
        year: yr,
        person: { companyId },
      },
      include: {
        person: {
          select: { id: true, firstName: true, lastName: true, level: true, region: true },
        },
      },
      orderBy: { total: 'desc' },
    });

    const total = payments.reduce((acc, p) => acc + Number(p.total), 0);

    return {
      weekNumber: week,
      year: yr,
      totalPayout: total,
      paymentsCount: payments.length,
      approvedCount: payments.filter((p) => p.status === 'APPROVED').length,
      payments,
    };
  }

  async markAsPaid(paymentId: string) {
    return this.prisma.weeklyPayment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
