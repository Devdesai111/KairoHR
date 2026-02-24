import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSalaryTemplateDto } from './dto/create-salary-template.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { CreateReimbursementDto } from './dto/reimbursement.dto';

interface SalaryComponent {
  name: string; type: 'EARNING' | 'DEDUCTION'; calculationType: 'FIXED' | 'PERCENTAGE';
  value: number; basedOn?: string; isStatutory?: boolean;
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // Salary Templates
  async getTemplates(orgId: string) { return this.prisma.salaryTemplate.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }); }
  async createTemplate(orgId: string, dto: CreateSalaryTemplateDto) {
    return this.prisma.salaryTemplate.create({
      data: {
        orgId,
        name: dto.name,
        ctc: dto.ctc,
        components: dto.components as any,
      },
    });
  }
  async updateTemplate(orgId: string, id: string, dto: Partial<CreateSalaryTemplateDto>) {
    const t = await this.prisma.salaryTemplate.findFirst({ where: { id, orgId } });
    if (!t) throw new NotFoundException('Template not found');
    return this.prisma.salaryTemplate.update({ where: { id }, data: { ...(dto as any) } });
  }
  async deleteTemplate(orgId: string, id: string) {
    const t = await this.prisma.salaryTemplate.findFirst({ where: { id, orgId } });
    if (!t) throw new NotFoundException('Template not found');
    await this.prisma.salaryTemplate.delete({ where: { id } });
    return { message: 'Template deleted' };
  }

  // Employee Salary
  async getEmployeeSalary(orgId: string, employeeId: string) {
    const e = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!e) throw new NotFoundException('Employee not found');
    return this.prisma.employeeSalary.findUnique({ where: { employeeId }, include: { template: true } });
  }
  async assignSalary(orgId: string, employeeId: string, data: { ctc: number; components: SalaryComponent[]; templateId?: string; effectiveFrom: string }) {
    const e = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!e) throw new NotFoundException('Employee not found');
    return this.prisma.employeeSalary.upsert({
      where: { employeeId },
      create: {
        employeeId,
        ctc: data.ctc,
        components: data.components as any,
        templateId: data.templateId,
        effectiveFrom: new Date(data.effectiveFrom),
      },
      update: {
        ctc: data.ctc,
        components: data.components as any,
        templateId: data.templateId,
        effectiveFrom: new Date(data.effectiveFrom),
      },
    });
  }

  // Payroll Runs
  async getPayrollRuns(orgId: string) { return this.prisma.payrollRun.findMany({ where: { orgId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] }); }
  async getPayrollRun(orgId: string, id: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id, orgId }, include: { payslips: { include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true } } }, take: 50 } } });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }
  async createPayrollRun(orgId: string, dto: CreatePayrollRunDto, userId: string) {
    const existing = await this.prisma.payrollRun.findFirst({ where: { orgId, month: dto.month, year: dto.year } });
    if (existing) throw new BadRequestException('Payroll run already exists for this period');
    return this.prisma.payrollRun.create({ data: { orgId, month: dto.month, year: dto.year, processedBy: userId } });
  }

  async computePayroll(orgId: string, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, orgId, status: 'DRAFT' } });
    if (!run) throw new NotFoundException('Payroll run not found or not in DRAFT status');

    await this.prisma.payrollRun.update({ where: { id: runId }, data: { status: 'PROCESSING' } });

    try {
      const employees = await this.prisma.employee.findMany({
        where: { orgId, status: 'ACTIVE' },
        include: { salary: true },
      });

      const payslips: Array<{ payrollRunId: string; employeeId: string; earnings: Record<string, number>; deductions: Record<string, number>; gross: number; totalDeductions: number; netPay: number; daysWorked: number; daysAbsent: number; lossOfPay: number }> = [];

      const daysInMonth = new Date(run.year, run.month, 0).getDate();

      for (const emp of employees) {
        if (!emp.salary) continue;

        // Get attendance for the month
        const monthStart = new Date(run.year, run.month - 1, 1);
        const monthEnd = new Date(run.year, run.month, 0);
        const attendance = await this.prisma.attendanceRecord.findMany({
          where: { employeeId: emp.id, date: { gte: monthStart, lte: monthEnd } },
        });

        const workingDays = attendance.filter(a => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length;
        const halfDays = attendance.filter(a => a.status === 'HALF_DAY').length;
        const effectiveDays = workingDays - (halfDays * 0.5);
        const daysAbsent = Math.max(0, daysInMonth - effectiveDays);
        const lopDays = daysAbsent;

        const components = emp.salary.components as unknown as SalaryComponent[];
        const earnings: Record<string, number> = {};
        const deductions: Record<string, number> = {};

        let basic = 0;
        let gross = 0;

        // Calculate earnings
        for (const comp of components.filter(c => c.type === 'EARNING' && !c.isStatutory)) {
          let amount = 0;
          if (comp.calculationType === 'FIXED') {
            amount = comp.value;
          } else if (comp.calculationType === 'PERCENTAGE' && comp.basedOn === 'CTC') {
            amount = (emp.salary.ctc / 12) * (comp.value / 100);
          }
          if (comp.name.toLowerCase().includes('basic')) basic = amount;
          earnings[comp.name] = Math.round(amount);
          gross += amount;
        }

        if (gross === 0) {
          gross = emp.salary.ctc / 12;
          earnings['Basic'] = Math.round(gross * 0.5);
          earnings['HRA'] = Math.round(gross * 0.2);
          earnings['Special Allowance'] = Math.round(gross * 0.3);
          basic = earnings['Basic'];
        }

        // LOP
        const dailyRate = gross / daysInMonth;
        const lopAmount = dailyRate * lopDays;
        if (lopDays > 0) deductions['Loss of Pay'] = Math.round(lopAmount);

        // PF (12% of basic, max 15000 ceiling)
        const pfBasic = Math.min(basic, 15000);
        const employeePF = Math.round(pfBasic * 0.12);
        const employerPF = Math.round(pfBasic * 0.12);
        deductions['PF (Employee)'] = employeePF;
        earnings['PF (Employer)'] = employerPF;

        // ESI (0.75% of gross if <= 21000)
        if (gross <= 21000) {
          deductions['ESI (Employee)'] = Math.round(gross * 0.0075);
        }

        // Professional Tax (simplified Karnataka slabs)
        let pt = 0;
        if (gross > 15000) pt = 200;
        else if (gross > 10000) pt = 150;
        if (pt > 0) deductions['Professional Tax'] = pt;

        // Get reimbursements
        const reimbursements = await this.prisma.reimbursement.findMany({ where: { employeeId: emp.id, status: 'APPROVED', processedInPayrollId: null } });
        let reimbursementTotal = 0;
        for (const r of reimbursements) {
          earnings[`Reimbursement: ${r.type}`] = r.amount;
          reimbursementTotal += r.amount;
        }

        // Get loan EMI
        const activeLoans = await this.prisma.loan.findMany({ where: { employeeId: emp.id, status: 'ACTIVE' } });
        for (const loan of activeLoans) {
          deductions[`Loan EMI (${loan.type})`] = loan.emi;
          await this.prisma.loanRepayment.create({ data: { loanId: loan.id, payrollRunId: runId, amount: loan.emi, date: new Date() } });
        }

        const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
        const totalEarnings = Object.values(earnings).reduce((a, b) => a + b, 0);
        const netPay = totalEarnings - totalDeductions;

        payslips.push({ payrollRunId: runId, employeeId: emp.id, earnings, deductions, gross: totalEarnings, totalDeductions, netPay: Math.max(0, netPay), daysWorked: effectiveDays, daysAbsent: lopDays, lossOfPay: Math.round(lopAmount) });

        // Mark reimbursements
        if (reimbursements.length > 0) {
          await this.prisma.reimbursement.updateMany({ where: { id: { in: reimbursements.map(r => r.id) } }, data: { processedInPayrollId: runId, status: 'PROCESSED' } });
        }
      }

      // Create payslips
      if (payslips.length > 0) {
        await this.prisma.paySlip.createMany({ data: payslips });
      }

      const totals = payslips.reduce((acc, p) => ({ gross: acc.gross + p.gross, deductions: acc.deductions + p.totalDeductions, net: acc.net + p.netPay }), { gross: 0, deductions: 0, net: 0 });

      await this.prisma.payrollRun.update({ where: { id: runId }, data: { status: 'COMPUTED', totalGross: totals.gross, totalDeductions: totals.deductions, totalNet: totals.net, totalEmployees: payslips.length, processedAt: new Date() } });

      return { message: 'Payroll computed', employees: payslips.length, totals };
    } catch (e) {
      await this.prisma.payrollRun.update({ where: { id: runId }, data: { status: 'FAILED' } });
      throw e;
    }
  }

  async approvePayroll(orgId: string, runId: string, approvedBy: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, orgId, status: 'COMPUTED' } });
    if (!run) throw new NotFoundException('Payroll run not found or not computed');
    return this.prisma.payrollRun.update({ where: { id: runId }, data: { status: 'APPROVED', approvedBy, approvedAt: new Date() } });
  }

  async markPaid(orgId: string, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, orgId, status: 'APPROVED' } });
    if (!run) throw new NotFoundException('Payroll run not found or not approved');
    await this.prisma.payrollRun.update({ where: { id: runId }, data: { status: 'PAID' } });
    await this.prisma.paySlip.updateMany({ where: { payrollRunId: runId }, data: { status: 'FINALIZED' } });
    return { message: 'Payroll marked as paid' };
  }

  async getMyPayslips(orgId: string, employeeId: string) {
    return this.prisma.paySlip.findMany({ where: { employeeId }, include: { payrollRun: { select: { month: true, year: true, status: true } } }, orderBy: { createdAt: 'desc' } });
  }

  // Reimbursements
  async getReimbursements(orgId: string, employeeId?: string) {
    return this.prisma.reimbursement.findMany({ where: { orgId, ...(employeeId && { employeeId }) }, include: { employee: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
  }
  async createReimbursement(orgId: string, employeeId: string, dto: CreateReimbursementDto) {
    return this.prisma.reimbursement.create({ data: { orgId, employeeId, type: dto.type, amount: dto.amount, description: dto.description, receiptUrl: dto.receiptUrl } });
  }
  async approveReimbursement(orgId: string, id: string, approvedBy: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
    const r = await this.prisma.reimbursement.findFirst({ where: { id, orgId, status: 'PENDING' } });
    if (!r) throw new NotFoundException('Reimbursement not found');
    return this.prisma.reimbursement.update({ where: { id }, data: { status, approvedBy, approverComments: comments } });
  }

  // Loans
  async getLoans(orgId: string, employeeId?: string) {
    return this.prisma.loan.findMany({ where: { orgId, ...(employeeId && { employeeId }) }, include: { employee: { select: { id: true, firstName: true, lastName: true } }, repayments: { orderBy: { date: 'desc' }, take: 12 } }, orderBy: { createdAt: 'desc' } });
  }
  async createLoan(orgId: string, employeeId: string, data: { type: string; amount: number; emi: number; tenureMonths: number; notes?: string }) {
    return this.prisma.loan.create({ data: { orgId, employeeId, type: data.type, amount: data.amount, emi: data.emi, tenureMonths: data.tenureMonths, outstanding: data.amount, notes: data.notes } });
  }
  async approveLoan(orgId: string, id: string, status: 'ACTIVE' | 'REJECTED') {
    const l = await this.prisma.loan.findFirst({ where: { id, orgId, status: 'PENDING' } });
    if (!l) throw new NotFoundException('Loan not found');
    const data: Record<string, unknown> = { status };
    if (status === 'ACTIVE') { data.disbursedAmount = l.amount; data.disbursedAt = new Date(); }
    return this.prisma.loan.update({ where: { id }, data });
  }

  async getDashboardStats(orgId: string) {
    const currentMonth = new Date().getMonth() + 1; const currentYear = new Date().getFullYear();
    const [lastRun, pendingReimbursements, activeLoans] = await Promise.all([
      this.prisma.payrollRun.findFirst({ where: { orgId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] }),
      this.prisma.reimbursement.count({ where: { orgId, status: 'PENDING' } }),
      this.prisma.loan.count({ where: { orgId, status: 'ACTIVE' } }),
    ]);
    return { lastRun, pendingReimbursements, activeLoans, currentPeriod: `${currentMonth}/${currentYear}` };
  }
}
