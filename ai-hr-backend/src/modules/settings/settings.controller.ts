import { Controller, Get, Patch, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get() getSettings(@CurrentUser() u: JwtPayload) { return this.svc.getSettings(u.orgId); }
  @Patch(':key') updateSetting(@CurrentUser() u: JwtPayload, @Param('key') key: string, @Body() body: { value: unknown }) { return this.svc.updateSetting(u.orgId, key, body.value); }
  @Get('notifications') getNotifPrefs(@CurrentUser() u: JwtPayload) { return this.svc.getNotificationPreferences(u.sub); }
  @Put('notifications') updateNotifPrefs(@CurrentUser() u: JwtPayload, @Body() body: any) { return this.svc.updateNotificationPreferences(u.sub, body); }
  @Get('integrations') getIntegrations(@CurrentUser() u: JwtPayload) { return this.svc.getIntegrations(u.orgId); }
  @Patch('integrations/:type') upsertIntegration(@CurrentUser() u: JwtPayload, @Param('type') type: string, @Body() body: any) { return this.svc.upsertIntegration(u.orgId, { ...body, type }); }
}
