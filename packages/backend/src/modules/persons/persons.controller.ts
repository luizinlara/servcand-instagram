import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import {
  CreatePersonPublicDto,
  CreatePersonInternalDto,
  UpdatePersonDto,
  ApprovePersonDto,
} from './dto/person.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Persons')
@Controller('persons')
export class PersonsController {
  constructor(private readonly service: PersonsService) {}

  // ============================================================
  // PUBLIC ENDPOINT - Cadastro aberto
  // ============================================================
  @Post('register')
  @ApiOperation({ summary: 'Cadastro público de pessoa (sem autenticação)' })
  registerPublic(@Body() dto: CreatePersonPublicDto) {
    return this.service.registerPublic(dto);
  }

  // ============================================================
  // PROTECTED ENDPOINTS
  // ============================================================
  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('persons:read')
  @ApiOperation({ summary: 'Listar pessoas/funcionários' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'registrationType', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.service.findAll(user.companyId, user, query);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('persons:read')
  @ApiOperation({ summary: 'Estatísticas de pessoas por empresa' })
  getStats(@CurrentUser('companyId') companyId: string) {
    return this.service.getStats(companyId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('persons:read')
  @ApiOperation({ summary: 'Buscar pessoa por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('persons:create')
  @ApiOperation({ summary: 'Cadastro interno de pessoa (por lideranças)' })
  createInternal(@Body() dto: CreatePersonInternalDto) {
    return this.service.createInternal(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('persons:update')
  @ApiOperation({ summary: 'Atualizar dados da pessoa' })
  update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('persons:approve')
  @ApiOperation({ summary: 'Aprovar ou alterar status da pessoa' })
  approve(@Param('id') id: string, @Body() dto: ApprovePersonDto) {
    return this.service.approve(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('persons:delete')
  @ApiOperation({ summary: 'Remover pessoa' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
