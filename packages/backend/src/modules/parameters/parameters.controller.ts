import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParametersService } from './parameters.service';
import { UpdateParametersDto } from './dto/parameters.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Parameters')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('parameters')
export class ParametersController {
  constructor(private readonly service: ParametersService) {}

  @Get()
  @RequirePermissions('parameters:read')
  @ApiOperation({ summary: 'Obter parâmetros da empresa' })
  getParameters(@CurrentUser('companyId') companyId: string) {
    return this.service.getParameters(companyId);
  }

  @Put()
  @RequirePermissions('parameters:update')
  @ApiOperation({ summary: 'Atualizar parâmetros do sistema (salário, missões, etc.)' })
  updateParameters(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateParametersDto,
  ) {
    return this.service.updateParameters(companyId, dto);
  }
}
