import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadershipService } from './leadership.service';
import { CreateLeadershipDto, UpdateLeadershipDto } from './dto/leadership.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Leadership')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('leadership')
export class LeadershipController {
  constructor(private readonly service: LeadershipService) {}

  @Get()
  @RequirePermissions('leadership:read')
  @ApiOperation({ summary: 'Listar lideranças' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.companyId, user);
  }

  @Get('region/:regionId')
  @RequirePermissions('leadership:read')
  @ApiOperation({ summary: 'Lideranças por região' })
  findByRegion(@Param('regionId') regionId: string) {
    return this.service.findByRegion(regionId);
  }

  @Get(':id')
  @RequirePermissions('leadership:read')
  @ApiOperation({ summary: 'Buscar liderança por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('leadership:create')
  @ApiOperation({ summary: 'Designar liderança regional' })
  create(@Body() dto: CreateLeadershipDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @RequirePermissions('leadership:update')
  @ApiOperation({ summary: 'Atualizar liderança' })
  update(@Param('id') id: string, @Body() dto: UpdateLeadershipDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('leadership:update')
  @ApiOperation({ summary: 'Desativar liderança' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Delete(':id')
  @RequirePermissions('leadership:delete')
  @ApiOperation({ summary: 'Remover liderança' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
