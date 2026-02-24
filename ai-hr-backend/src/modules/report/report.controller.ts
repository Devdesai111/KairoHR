import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(private readonly svc: ReportService) {}

  @Get('headcount') @ApiOperation({ summary: 'Headcount analytics' }) getHeadcount(@CurrentUser() u: JwtPayload) { return this.svc.getHeadcount(u.orgId); }
  @Get('attrition') @ApiOperation({ summary: 'Attrition metrics' }) getAttrition(@CurrentUser() u: JwtPayload) { return this.svc.getAttrition(u.orgId); }
  @Get('attendance-summary') getAttendance(@CurrentUser() u: JwtPayload, @Query('month') m?: string, @Query('year') y?: string) { return this.svc.getAttendanceSummary(u.orgId, Number(m)||new Date().getMonth()+1, Number(y)||new Date().getFullYear()); }
  @Get('leave-summary') getLeave(@CurrentUser() u: JwtPayload) { return this.svc.getLeaveSummary(u.orgId); }
  @Get('payroll-summary') getPayroll(@CurrentUser() u: JwtPayload) { return this.svc.getPayrollSummary(u.orgId); }
  @Get('recruitment-funnel') getRecruitment(@CurrentUser() u: JwtPayload) { return this.svc.getRecruitmentFunnel(u.orgId); }
  @Post('export') exportReport(@CurrentUser() u: JwtPayload, @Body() body: { type: string }) { return this.svc.exportReport(u.orgId, body.type); }
}
