import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MissionsService } from './missions.service';
import { CreateMissionDto, UpdateMissionDto, ValidateMissionDto } from './dto/mission.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Missions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly service: MissionsService) {}

  @Get()
  @RequirePermissions('missions:read')
  @ApiOperation({ summary: 'Listar missões' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.companyId, user);
  }

  @Get('person/:personId/weekly')
  @RequirePermissions('missions:read')
  @ApiOperation({ summary: 'Missões semanais de uma pessoa' })
  getWeeklyMissions(
    @Param('personId') personId: string,
    @Query('weekNumber') weekNumber?: number,
    @Query('year') year?: number,
  ) {
    return this.service.getWeeklyMissions(personId, weekNumber, year);
  }

  @Get('person/:personId')
  @RequirePermissions('missions:read')
  @ApiOperation({ summary: 'Histórico de missões de uma pessoa' })
  getPersonMissions(@Param('personId') personId: string, @Query() query: any) {
    return this.service.getPersonMissions(personId, query);
  }

  @Get(':id')
  @RequirePermissions('missions:read')
  @ApiOperation({ summary: 'Buscar missão por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('missions:create')
  @ApiOperation({ summary: 'Criar missão' })
  create(@Body() dto: CreateMissionDto) {
    return this.service.create(dto);
  }

  @Post('validate')
  @RequirePermissions('missions:validate')
  @ApiOperation({ summary: 'Validar/concluir missão de uma pessoa' })
  validateMission(@Body() dto: ValidateMissionDto) {
    return this.service.validateMission(dto);
  }

  @Put(':id')
  @RequirePermissions('missions:update')
  @ApiOperation({ summary: 'Atualizar missão' })
  update(@Param('id') id: string, @Body() dto: UpdateMissionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('missions:delete')
  @ApiOperation({ summary: 'Remover missão' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
