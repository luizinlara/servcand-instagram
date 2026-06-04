import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Get()
  @RequirePermissions('profiles:read')
  @ApiOperation({ summary: 'Listar perfis' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.companyId, user);
  }

  @Get('permissions')
  @RequirePermissions('profiles:read')
  @ApiOperation({ summary: 'Listar todas as permissões disponíveis' })
  findAllPermissions() {
    return this.service.findAllPermissions();
  }

  @Get(':id')
  @RequirePermissions('profiles:read')
  @ApiOperation({ summary: 'Buscar perfil por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('profiles:create')
  @ApiOperation({ summary: 'Criar perfil' })
  create(@Body() dto: CreateProfileDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @RequirePermissions('profiles:update')
  @ApiOperation({ summary: 'Atualizar perfil e permissões' })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('profiles:delete')
  @ApiOperation({ summary: 'Remover perfil' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
