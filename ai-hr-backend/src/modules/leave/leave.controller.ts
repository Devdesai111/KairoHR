import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { LeaveFilterDto } from './dto/leave-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('leave')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('leave')
export class LeaveController {
  constructor(private readonly svc: LeaveService) {}

  // Leave Types
  @Get('types') getTypes(@CurrentUser() u: JwtPayload) { return this.svc.getLeaveTypes(u.orgId); }
  @Post('types') createType(@CurrentUser() u: JwtPayload, @Body() dto: CreateLeaveTypeDto) { return this.svc.createLeaveType(u.orgId, dto); }
  @Patch('types/:id') updateType(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateLeaveTypeDto>) { return this.svc.updateLeaveType(u.orgId, id, dto); }
  @Delete('types/:id') deleteType(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteLeaveType(u.orgId, id); }

  // Applications
  @Post('apply') apply(@CurrentUser() u: JwtPayload, @Body() dto: ApplyLeaveDto) { return this.svc.applyLeave(u.orgId, u.sub, dto); }
  @Get('applications') getApps(@CurrentUser() u: JwtPayload, @Query() f: LeaveFilterDto) { return this.svc.getApplications(u.orgId, f); }
  @Patch('applications/:id/cancel') cancel(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { reason?: string }) { return this.svc.cancelLeave(u.orgId, id, u.sub, body.reason); }

  // Approvals
  @Get('approvals') getApprovals(@CurrentUser() u: JwtPayload, @Query() f: LeaveFilterDto) { return this.svc.getApplications(u.orgId, { ...f, status: 'PENDING' }); }
  @Patch('approvals/:id') approve(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { status: 'APPROVED' | 'REJECTED'; comments?: string }) { return this.svc.approveLeave(u.orgId, id, u.sub, body.status, body.comments); }

  // Balances
  @Get('balances') getBalances(@CurrentUser() u: JwtPayload, @Query('employeeId') empId?: string) { return this.svc.getBalances(u.orgId, empId ?? u.sub); }
  @Get('balances/team') getTeamBalances(@CurrentUser() u: JwtPayload) { return this.svc.getTeamBalances(u.orgId, u.sub); }
  @Post('balances/initialize/:employeeId') initBalances(@CurrentUser() u: JwtPayload, @Param('employeeId') empId: string) { return this.svc.initializeBalances(u.orgId, empId); }

  // Calendar
  @Get('calendar') getCalendar(@CurrentUser() u: JwtPayload, @Query('year') year?: string, @Query('month') month?: string) { return this.svc.getCalendar(u.orgId, Number(year) || new Date().getFullYear(), Number(month) || new Date().getMonth() + 1); }

  // Dashboard
  @Get('dashboard/stats') getStats(@CurrentUser() u: JwtPayload, @Query('employeeId') empId?: string) { return this.svc.getDashboardStats(u.orgId, empId ?? u.sub); }
}
