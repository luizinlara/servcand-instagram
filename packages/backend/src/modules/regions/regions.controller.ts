import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto, UpdateRegionDto } from './dto/region.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Regions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('regions')
export class RegionsController {
  constructor(private readonly service: RegionsService) {}

  @Get()
  @RequirePermissions('regions:read')
  @ApiOperation({ summary: 'Listar regiões/bairros' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.companyId, user);
  }

  @Get(':id')
  @RequirePermissions('regions:read')
  @ApiOperation({ summary: 'Buscar região por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('regions:create')
  @ApiOperation({ summary: 'Criar região/bairro' })
  create(@Body() dto: CreateRegionDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @RequirePermissions('regions:update')
  @ApiOperation({ summary: 'Atualizar região' })
  update(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('regions:delete')
  @ApiOperation({ summary: 'Remover região' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
