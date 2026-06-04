import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Salary')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('salary')
export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  @Get('person/:personId')
  @RequirePermissions('salary:read')
  @ApiOperation({ summary: 'Dados salariais de uma pessoa' })
  getPersonSalary(@Param('personId') personId: string) {
    return this.service.getPersonSalary(personId);
  }

  @Post('generate-weekly')
  @RequirePermissions('salary:manage')
  @ApiOperation({ summary: 'Gerar pagamento semanal para uma pessoa' })
  generateWeeklyPayment(
    @Body() body: { personId: string; weekNumber: any; year: any },
  ) {
    return this.service.generateWeeklyPayment(body.personId, Number(body.weekNumber), Number(body.year));
  }

  @Post('generate-weekly/company')
  @RequirePermissions('salary:manage')
  @ApiOperation({ summary: 'Gerar pagamentos semanais para toda a empresa' })
  generateWeeklyPaymentsForCompany(
    @CurrentUser('companyId') companyId: string,
    @Body() body: { weekNumber: any; year: any },
  ) {
    return this.service.generateWeeklyPaymentsForCompany(companyId, Number(body.weekNumber), Number(body.year));
  }

  @Get('report')
  @RequirePermissions('salary:read')
  @ApiOperation({ summary: 'Relatório salarial da empresa' })
  getCompanySalaryReport(
    @CurrentUser('companyId') companyId: string,
    @Query('weekNumber') weekNumber?: string,
    @Query('year') year?: string,
  ) {
    const parsedWeek = weekNumber ? Number(weekNumber) : undefined;
    const parsedYear = year ? Number(year) : undefined;
    return this.service.getCompanySalaryReport(companyId, parsedWeek, parsedYear);
  }

  @Patch('payments/:id/paid')
  @RequirePermissions('salary:manage')
  @ApiOperation({ summary: 'Marcar pagamento como pago' })
  markAsPaid(@Param('id') id: string) {
    return this.service.markAsPaid(id);
  }
}
