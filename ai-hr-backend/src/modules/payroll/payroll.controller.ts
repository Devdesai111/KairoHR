import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreateSalaryTemplateDto } from './dto/create-salary-template.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { CreateReimbursementDto } from './dto/reimbursement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('payroll')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly svc: PayrollService) {}

  @Get('templates') getTemplates(@CurrentUser() u: JwtPayload) { return this.svc.getTemplates(u.orgId); }
  @Post('templates') createTemplate(@CurrentUser() u: JwtPayload, @Body() dto: CreateSalaryTemplateDto) { return this.svc.createTemplate(u.orgId, dto); }
  @Patch('templates/:id') updateTemplate(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateSalaryTemplateDto>) { return this.svc.updateTemplate(u.orgId, id, dto); }
  @Delete('templates/:id') deleteTemplate(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteTemplate(u.orgId, id); }

  @Get('employees/:id/salary') getSalary(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getEmployeeSalary(u.orgId, id); }
  @Post('employees/:id/salary') assignSalary(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { ctc: number; components: any[]; templateId?: string; effectiveFrom: string }) { return this.svc.assignSalary(u.orgId, id, body); }

  @Get('runs') getRuns(@CurrentUser() u: JwtPayload) { return this.svc.getPayrollRuns(u.orgId); }
  @Get('runs/:id') getRun(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getPayrollRun(u.orgId, id); }
  @Post('runs') createRun(@CurrentUser() u: JwtPayload, @Body() dto: CreatePayrollRunDto) { return this.svc.createPayrollRun(u.orgId, dto, u.sub); }
  @Post('runs/:id/compute') computeRun(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.computePayroll(u.orgId, id); }
  @Post('runs/:id/approve') approveRun(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.approvePayroll(u.orgId, id, u.sub); }
  @Post('runs/:id/pay') markPaid(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.markPaid(u.orgId, id); }

  @Get('payslips') getMyPayslips(@CurrentUser() u: JwtPayload) { return this.svc.getMyPayslips(u.orgId, u.sub); }

  @Get('reimbursements') getReibs(@CurrentUser() u: JwtPayload, @Query('employeeId') empId?: string) { return this.svc.getReimbursements(u.orgId, empId); }
  @Post('reimbursements') createReib(@CurrentUser() u: JwtPayload, @Body() dto: CreateReimbursementDto) { return this.svc.createReimbursement(u.orgId, u.sub, dto); }
  @Patch('reimbursements/:id') approveReib(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { status: 'APPROVED' | 'REJECTED'; comments?: string }) { return this.svc.approveReimbursement(u.orgId, id, u.sub, body.status as 'APPROVED' | 'REJECTED', body.comments); }

  @Get('loans') getLoans(@CurrentUser() u: JwtPayload, @Query('employeeId') empId?: string) { return this.svc.getLoans(u.orgId, empId); }
  @Post('loans') createLoan(@CurrentUser() u: JwtPayload, @Body() body: { employeeId: string; type: string; amount: number; emi: number; tenureMonths: number; notes?: string }) { return this.svc.createLoan(u.orgId, body.employeeId, body); }
  @Patch('loans/:id/approve') approveLoan(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { status: 'ACTIVE' | 'REJECTED' }) { return this.svc.approveLoan(u.orgId, id, body.status); }

  @Get('dashboard/stats') getStats(@CurrentUser() u: JwtPayload) { return this.svc.getDashboardStats(u.orgId); }
}
