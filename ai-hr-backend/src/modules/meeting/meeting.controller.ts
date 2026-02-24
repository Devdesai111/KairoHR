import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('meetings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('meetings')
export class MeetingController {
  constructor(private readonly svc: MeetingService) {}

  @Get('my') getMyMeetings(@CurrentUser() u: JwtPayload, @Query() f: PaginationDto) { return this.svc.getMyMeetings(u.orgId, u.sub, f); }
  @Get() getMeetings(@CurrentUser() u: JwtPayload, @Query() f: any) { return this.svc.getMeetings(u.orgId, f); }
  @Get('calendar') getCalendar(@CurrentUser() u: JwtPayload, @Query('year') y?: string, @Query('month') m?: string) { return this.svc.getCalendar(u.orgId, Number(y)||new Date().getFullYear(), Number(m)||new Date().getMonth()+1); }
  @Post() createMeeting(@CurrentUser() u: JwtPayload, @Body() dto: CreateMeetingDto) { return this.svc.createMeeting(u.orgId, u.sub, dto); }
  @Patch(':id') updateMeeting(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateMeetingDto>) { return this.svc.updateMeeting(u.orgId, id, dto); }
  @Post(':id/cancel') cancelMeeting(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.cancelMeeting(u.orgId, id); }
  @Get('analytics') getAnalytics(@CurrentUser() u: JwtPayload) { return this.svc.getAnalytics(u.orgId); }
  @Get('rooms') getRooms(@CurrentUser() u: JwtPayload) { return this.svc.getRooms(u.orgId); }
  @Post('rooms') createRoom(@CurrentUser() u: JwtPayload, @Body() body: { name: string; capacity?: number; locationId?: string }) { return this.svc.createRoom(u.orgId, body); }
  @Patch('rooms/:id') updateRoom(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) { return this.svc.updateRoom(u.orgId, id, body); }
}
