import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @RequirePermissions('companies:read')
  @ApiOperation({ summary: 'Listar todas as empresas' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() query: { isActive?: boolean; search?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('companies:read')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('companies:create')
  @ApiOperation({ summary: 'Criar nova empresa' })
  create(@Body() dto: CreateCompanyDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @RequirePermissions('companies:update')
  @ApiOperation({ summary: 'Atualizar empresa' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('companies:delete')
  @ApiOperation({ summary: 'Remover empresa' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/activate')
  @RequirePermissions('companies:update')
  @ApiOperation({ summary: 'Ativar empresa' })
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('companies:update')
  @ApiOperation({ summary: 'Desativar empresa' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
