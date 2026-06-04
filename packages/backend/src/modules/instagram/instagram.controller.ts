import {
  Controller, Get, Post, Put, Body, Param, Query,
  UseGuards, Res, HttpStatus, RawBodyRequest, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstagramService } from './instagram.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Instagram')
@Controller('instagram')
export class InstagramController {
  constructor(private readonly service: InstagramService) {}

  // ============================================================
  // PUBLIC WEBHOOK ENDPOINT (Meta calls this)
  // ============================================================
  @Get('webhook')
  @ApiOperation({ summary: 'Verificar webhook do Meta (GET)' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: any,
  ) {
    const result = this.service.verifyWebhook(mode, token, challenge);
    if (result) {
      return res.status(HttpStatus.OK).send(result);
    }
    return res.status(HttpStatus.FORBIDDEN).send('Forbidden');
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receber eventos do Instagram (POST)' })
  handleWebhook(@Body() body: any) {
    return this.service.handleWebhook(body);
  }

  // ============================================================
  // PROTECTED ENDPOINTS
  // ============================================================
  @Get('posts/:personId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('instagram:read')
  @ApiOperation({ summary: 'Posts do Instagram de uma pessoa' })
  findPostsByPerson(@Param('personId') personId: string, @Query() query: any) {
    return this.service.findPostsByPerson(personId, query);
  }

  @Post('posts/manual')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('instagram:manage')
  @ApiOperation({ summary: 'Registrar post manualmente e validar missões' })
  createManualPost(@Body() data: any) {
    return this.service.createManualPost(data);
  }

  @Get('config')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('instagram:read')
  @ApiOperation({ summary: 'Configurações do Instagram da empresa' })
  getConfig(@CurrentUser('companyId') companyId: string) {
    return this.service.getConfig(companyId);
  }

  @Put('config')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('instagram:manage')
  @ApiOperation({ summary: 'Atualizar configurações do Instagram' })
  upsertConfig(@CurrentUser('companyId') companyId: string, @Body() config: any) {
    return this.service.upsertConfig(companyId, config);
  }

  @Post('validate/:personId/:postId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions('instagram:manage')
  @ApiOperation({ summary: 'Forçar validação de missões de um post' })
  validatePost(@Param('personId') personId: string, @Param('postId') postId: string) {
    return this.service.autoValidateMissions(personId, postId);
  }
}
