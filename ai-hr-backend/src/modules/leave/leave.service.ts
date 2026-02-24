import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { LeaveFilterDto } from './dto/leave-filter.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  private calcDays(from: Date, to: Date, halfDay?: string): number {
    if (halfDay) return 0.5;
    let days = 0;
    const cur = new Date(from);
    while (cur <= to) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) days++;
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  // Leave Types
  async getLeaveTypes(orgId: string) { return this.prisma.leaveType.findMany({ where: { orgId, isActive: true }, orderBy: { name: 'asc' } }); }
  async createLeaveType(orgId: string, dto: CreateLeaveTypeDto) { return this.prisma.leaveType.create({ data: { orgId, ...dto } }); }
  async updateLeaveType(orgId: string, id: string, dto: Partial<CreateLeaveTypeDto>) {
    const lt = await this.prisma.leaveType.findFirst({ where: { id, orgId } });
    if (!lt) throw new NotFoundException('Leave type not found');
    return this.prisma.leaveType.update({ where: { id }, data: dto });
  }
  async deleteLeaveType(orgId: string, id: string) {
    const lt = await this.prisma.leaveType.findFirst({ where: { id, orgId } });
    if (!lt) throw new NotFoundException('Leave type not found');
    await this.prisma.leaveType.update({ where: { id }, data: { isActive: false } });
    return { message: 'Leave type deactivated' };
  }

  // Applications
  async applyLeave(orgId: string, employeeId: string, dto: ApplyLeaveDto) {
    const leaveType = await this.prisma.leaveType.findFirst({ where: { id: dto.leaveTypeId, orgId } });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const from = new Date(dto.fromDate); const to = new Date(dto.toDate);
    if (from > to) throw new BadRequestException('From date must be before to date');

    const days = this.calcDays(from, to, dto.halfDayType);

    // Check balance
    const year = from.getFullYear();
    const balance = await this.prisma.leaveBalance.findFirst({ where: { employeeId, leaveTypeId: dto.leaveTypeId, year } });
    if (balance && balance.balance < days) throw new BadRequestException(`Insufficient leave balance. Available: ${balance.balance} days`);

    // Check overlap
    const overlap = await this.prisma.leaveApplication.findFirst({
      where: { employeeId, status: { in: ['PENDING', 'APPROVED'] }, OR: [{ fromDate: { lte: to }, toDate: { gte: from } }] },
    });
    if (overlap) throw new BadRequestException('Leave dates overlap with an existing application');

    const app = await this.prisma.leaveApplication.create({
      data: { orgId, employeeId, leaveTypeId: dto.leaveTypeId, fromDate: from, toDate: to, days, halfDayType: dto.halfDayType, reason: dto.reason, attachmentUrl: dto.attachmentUrl },
    });

    // Reserve pending
    if (balance) await this.prisma.leaveBalance.update({ where: { id: balance.id }, data: { pending: { increment: days } } });
    return app;
  }

  async getApplications(orgId: string, filter: LeaveFilterDto) {
    const { page = 1, pageSize = 20, employeeId, status, leaveTypeId, fromDate, toDate } = filter;
    const where: Prisma.LeaveApplicationWhereInput = { orgId, ...(employeeId && { employeeId }), ...(status && { status: status as any }), ...(leaveTypeId && { leaveTypeId }), ...(fromDate || toDate ? { fromDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } } : {}) };
    const [data, total] = await Promise.all([
      this.prisma.leaveApplication.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, include: { leaveType: { select: { id: true, name: true, color: true } }, employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.leaveApplication.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async approveLeave(orgId: string, id: string, approverId: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
    const app = await this.prisma.leaveApplication.findFirst({ where: { id, orgId, status: 'PENDING' } });
    if (!app) throw new NotFoundException('Leave application not found or already processed');

    await this.prisma.leaveApplication.update({ where: { id }, data: { status, approverId, approverComments: comments, approvedAt: new Date() } });

    // Update balance
    const year = app.fromDate.getFullYear();
    const balance = await this.prisma.leaveBalance.findFirst({ where: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year } });
    if (balance) {
      if (status === 'APPROVED') {
        await this.prisma.leaveBalance.update({ where: { id: balance.id }, data: { used: { increment: app.days }, balance: { decrement: app.days }, pending: { decrement: app.days } } });
      } else {
        await this.prisma.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: app.days } } });
      }
    }
    return { message: `Leave ${status.toLowerCase()}` };
  }

  async cancelLeave(orgId: string, id: string, employeeId: string, reason?: string) {
    const app = await this.prisma.leaveApplication.findFirst({ where: { id, orgId, employeeId, status: { in: ['PENDING', 'APPROVED'] } } });
    if (!app) throw new NotFoundException('Leave application not found or cannot be cancelled');
    await this.prisma.leaveApplication.update({ where: { id }, data: { status: 'CANCELLED', cancellationReason: reason } });
    const year = app.fromDate.getFullYear();
    const balance = await this.prisma.leaveBalance.findFirst({ where: { employeeId, leaveTypeId: app.leaveTypeId, year } });
    if (balance) {
      if (app.status === 'APPROVED') await this.prisma.leaveBalance.update({ where: { id: balance.id }, data: { used: { decrement: app.days }, balance: { increment: app.days } } });
      else await this.prisma.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: app.days } } });
    }
    return { message: 'Leave cancelled' };
  }

  async getBalances(orgId: string, employeeId: string) {
    const year = new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({ where: { orgId, employeeId, year }, include: { leaveType: { select: { id: true, name: true, color: true, isPaid: true } } } });
  }

  async getTeamBalances(orgId: string, managerId: string) {
    const year = new Date().getFullYear();
    const subordinates = await this.prisma.employee.findMany({ where: { orgId, reportingManagerId: managerId }, select: { id: true } });
    const empIds = subordinates.map(e => e.id);
    return this.prisma.leaveBalance.findMany({ where: { orgId, employeeId: { in: empIds }, year }, include: { employee: { select: { id: true, firstName: true, lastName: true } }, leaveType: { select: { id: true, name: true, color: true } } } });
  }

  async getCalendar(orgId: string, year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    return this.prisma.leaveApplication.findMany({ where: { orgId, status: 'APPROVED', fromDate: { lte: to }, toDate: { gte: from } }, include: { employee: { select: { id: true, firstName: true, lastName: true } }, leaveType: { select: { id: true, name: true, color: true } } }, orderBy: { fromDate: 'asc' } });
  }

  async getDashboardStats(orgId: string, employeeId: string) {
    const year = new Date().getFullYear();
    const [balances, pending, approved] = await Promise.all([
      this.prisma.leaveBalance.findMany({ where: { orgId, employeeId, year }, include: { leaveType: true } }),
      this.prisma.leaveApplication.count({ where: { orgId, employeeId, status: 'PENDING' } }),
      this.prisma.leaveApplication.count({ where: { orgId, employeeId, status: 'APPROVED', fromDate: { gte: new Date(year, 0, 1) } } }),
    ]);
    return { balances, pendingApplications: pending, approvedThisYear: approved };
  }

  // Initialize balances for employee
  async initializeBalances(orgId: string, employeeId: string) {
    const year = new Date().getFullYear();
    const leaveTypes = await this.prisma.leaveType.findMany({ where: { orgId, isActive: true } });
    for (const lt of leaveTypes) {
      await this.prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: lt.id, year } },
        create: { orgId, employeeId, leaveTypeId: lt.id, year, total: lt.maxDaysPerYear, balance: lt.maxDaysPerYear },
        update: {},
      });
    }
    return { message: 'Balances initialized' };
  }
}
