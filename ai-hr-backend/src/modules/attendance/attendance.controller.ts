import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { CreateRegularizationDto } from './dto/regularization.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly svc: AttendanceService) {}

  @Post('check-in') checkIn(@CurrentUser() u: JwtPayload, @Body() dto: CheckInDto) { return this.svc.checkIn(u.orgId, u.sub, dto); }
  @Post('check-out') checkOut(@CurrentUser() u: JwtPayload, @Body() body: { notes?: string }) { return this.svc.checkOut(u.orgId, u.sub, body); }
  @Get('live') getLive(@CurrentUser() u: JwtPayload) { return this.svc.getLiveAttendance(u.orgId); }
  @Get('history') getHistory(@CurrentUser() u: JwtPayload, @Query() filter: AttendanceFilterDto) { return this.svc.getHistory(u.orgId, filter); }
  @Get('dashboard/stats') getStats(@CurrentUser() u: JwtPayload) { return this.svc.getDashboardStats(u.orgId); }

  // Shifts
  @Get('shifts') getShifts(@CurrentUser() u: JwtPayload) { return this.svc.getShifts(u.orgId); }
  @Post('shifts') createShift(@CurrentUser() u: JwtPayload, @Body() dto: CreateShiftDto) { return this.svc.createShift(u.orgId, dto); }
  @Patch('shifts/:id') updateShift(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateShiftDto>) { return this.svc.updateShift(u.orgId, id, dto); }
  @Delete('shifts/:id') deleteShift(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteShift(u.orgId, id); }

  // Rosters
  @Get('rosters') getRosters(@CurrentUser() u: JwtPayload, @Query('date') date?: string) { return this.svc.getRosters(u.orgId, date); }
  @Post('rosters') assignRoster(@CurrentUser() u: JwtPayload, @Body() body: { employeeId: string; shiftId: string; date: string }) { return this.svc.assignRoster(u.orgId, body.employeeId, body.shiftId, body.date); }

  // Regularization
  @Post('regularization') createReg(@CurrentUser() u: JwtPayload, @Body() dto: CreateRegularizationDto) { return this.svc.createRegularization(u.orgId, u.sub, dto); }
  @Get('regularization/pending') getPending(@CurrentUser() u: JwtPayload) { return this.svc.getPendingRegularizations(u.orgId); }
  @Patch('regularization/:id') approveReg(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { status: 'APPROVED' | 'REJECTED'; comments?: string }) { return this.svc.approveRegularization(u.orgId, id, u.sub, body.status, body.comments); }
}
