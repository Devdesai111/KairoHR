import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getHeadcount(orgId: string) {
    const [total, byDept, byType, byStatus, monthlyJoining] = await Promise.all([
      this.prisma.employee.count({ where: { orgId } }),
      this.prisma.employee.groupBy({ by: ['departmentId'], where: { orgId, status: 'ACTIVE' }, _count: { id: true } }),
      this.prisma.employee.groupBy({ by: ['employmentType'], where: { orgId }, _count: { id: true } }),
      this.prisma.employee.groupBy({ by: ['status'], where: { orgId }, _count: { id: true } }),
      this.prisma.$queryRaw`SELECT DATE_TRUNC('month', "date_of_joining") as month, COUNT(*) as count FROM employees WHERE org_id = ${orgId} AND date_of_joining >= NOW() - INTERVAL '12 months' GROUP BY 1 ORDER BY 1`,
    ]);
    return { total, byDept, byType, byStatus, monthlyJoining };
  }

  async getAttrition(orgId: string) {
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const [exits, total, byDept, byReason] = await Promise.all([
      this.prisma.employee.count({ where: { orgId, status: 'EXITED', dateOfExit: { gte: yearStart } } }),
      this.prisma.employee.count({ where: { orgId } }),
      this.prisma.employee.groupBy({ by: ['departmentId'], where: { orgId, status: 'EXITED', dateOfExit: { gte: yearStart } }, _count: { id: true } }),
      this.prisma.employee.count({ where: { orgId, status: 'ON_NOTICE' } }),
    ]);
    return { exits, total, rate: total > 0 ? ((exits / total) * 100).toFixed(2) : 0, byDept, onNotice: byReason };
  }

  async getAttendanceSummary(orgId: string, month: number, year: number) {
    const start = new Date(year, month-1, 1); const end = new Date(year, month, 0);
    const [byStatus, avgWorkHours, lateCount] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({ by: ['status'], where: { orgId, date: { gte: start, lte: end } }, _count: { id: true } }),
      this.prisma.attendanceRecord.aggregate({ where: { orgId, date: { gte: start, lte: end } }, _avg: { workMinutes: true } }),
      this.prisma.attendanceRecord.count({ where: { orgId, date: { gte: start, lte: end }, status: 'LATE' } }),
    ]);
    return { byStatus, avgWorkHours: Math.round((avgWorkHours._avg.workMinutes ?? 0) / 60), lateCount, period: `${month}/${year}` };
  }

  async getLeaveSummary(orgId: string) {
    const year = new Date().getFullYear();
    const [byType, byStatus, topLeaveTypes] = await Promise.all([
      this.prisma.leaveApplication.groupBy({ by: ['leaveTypeId'], where: { orgId, status: 'APPROVED', fromDate: { gte: new Date(year, 0, 1) } }, _count: { id: true }, _sum: { days: true } }),
      this.prisma.leaveApplication.groupBy({ by: ['status'], where: { orgId }, _count: { id: true } }),
      this.prisma.leaveType.findMany({ where: { orgId }, select: { id: true, name: true, color: true } }),
    ]);
    return { byType, byStatus, topLeaveTypes, year };
  }

  async getPayrollSummary(orgId: string) {
    const runs = await this.prisma.payrollRun.findMany({ where: { orgId }, orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12, select: { month: true, year: true, totalGross: true, totalNet: true, totalDeductions: true, totalEmployees: true, status: true } });
    const latest = runs[0];
    return { runs, latest, totalYTD: runs.reduce((a, r) => a + r.totalNet, 0) };
  }

  async getRecruitmentFunnel(orgId: string) {
    const [totalJobs, totalApps, byStage, recentHires] = await Promise.all([
      this.prisma.jobRequisition.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.application.count({ where: { job: { orgId } } }),
      this.prisma.application.groupBy({ by: ['stage'], where: { job: { orgId } }, _count: { id: true } }),
      this.prisma.application.count({ where: { job: { orgId }, stage: 'HIRED' } }),
    ]);
    return { totalJobs, totalApps, byStage, recentHires };
  }

  async exportReport(orgId: string, type: string) {
    // Return data for export (frontend handles CSV generation)
    switch (type) {
      case 'headcount': return this.getHeadcount(orgId);
      case 'attrition': return this.getAttrition(orgId);
      case 'attendance': return this.getAttendanceSummary(orgId, new Date().getMonth()+1, new Date().getFullYear());
      case 'leave': return this.getLeaveSummary(orgId);
      case 'payroll': return this.getPayrollSummary(orgId);
      case 'recruitment': return this.getRecruitmentFunnel(orgId);
      default: throw new Error(`Unknown report type: ${type}`);
    }
  }
}
