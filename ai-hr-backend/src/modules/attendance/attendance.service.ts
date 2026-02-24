import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { CheckInDto } from './dto/check-in.dto';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { CreateRegularizationDto } from './dto/regularization.dto';
import { CreateShiftDto } from './dto/create-shift.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async checkIn(orgId: string, employeeId: string, dto: CheckInDto) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await this.prisma.attendanceRecord.findFirst({ where: { orgId, employeeId, date: today } });
    if (existing) {
      if (existing.checkIn) throw new BadRequestException('Already checked in today');
    }
    const record = existing
      ? await this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkIn: new Date(), checkInMethod: 'WEB', locationId: dto.locationId, isRemote: dto.isRemote ?? false, geoLocation: dto.geoLocation ?? undefined, status: 'PRESENT', notes: dto.notes } })
      : await this.prisma.attendanceRecord.create({ data: { orgId, employeeId, date: today, checkIn: new Date(), checkInMethod: 'WEB', locationId: dto.locationId, isRemote: dto.isRemote ?? false, geoLocation: dto.geoLocation ?? undefined, status: 'PRESENT', notes: dto.notes } });
    await this.cache.del(`attendance:live:${orgId}`);
    return record;
  }

  async checkOut(orgId: string, employeeId: string, dto: { notes?: string }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await this.prisma.attendanceRecord.findFirst({ where: { orgId, employeeId, date: today } });
    if (!record?.checkIn) throw new BadRequestException('No check-in found for today');
    if (record.checkOut) throw new BadRequestException('Already checked out today');

    const checkIn = record.checkIn;
    const checkOut = new Date();
    const workMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
    const status = workMinutes < 240 ? 'HALF_DAY' : workMinutes < 480 ? 'LATE' : 'PRESENT';

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { checkOut, checkOutMethod: 'WEB', workMinutes, status, notes: dto.notes },
    });
    await this.cache.del(`attendance:live:${orgId}`);
    return updated;
  }

  async getLiveAttendance(orgId: string) {
    const cacheKey = `attendance:live:${orgId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [total, present, absent, late, wfh] = await Promise.all([
      this.prisma.employee.count({ where: { orgId, status: 'ACTIVE' } }),
      this.prisma.attendanceRecord.count({ where: { orgId, date: today, status: 'PRESENT' } }),
      this.prisma.attendanceRecord.count({ where: { orgId, date: today, status: 'ABSENT' } }),
      this.prisma.attendanceRecord.count({ where: { orgId, date: today, status: 'LATE' } }),
      this.prisma.attendanceRecord.count({ where: { orgId, date: today, isRemote: true } }),
    ]);

    const recentCheckIns = await this.prisma.attendanceRecord.findMany({
      where: { orgId, date: today, checkIn: { not: null } },
      include: { employee: { select: { id: true, firstName: true, lastName: true, designation: true, profileImageUrl: true } } },
      orderBy: { checkIn: 'desc' },
      take: 10,
    });

    const result = { stats: { total, present, absent, late, wfh, percentage: total > 0 ? Math.round((present / total) * 100) : 0 }, recentCheckIns };
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async getHistory(orgId: string, filter: AttendanceFilterDto) {
    const { page = 1, pageSize = 20, employeeId, fromDate, toDate, status } = filter;
    const where: Prisma.AttendanceRecordWhereInput = {
      orgId,
      ...(employeeId && { employeeId }),
      ...(status && { status: status as any }),
      ...(fromDate || toDate ? { date: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } }, orderBy: { date: 'desc' } }),
      this.prisma.attendanceRecord.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async getDashboardStats(orgId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [todayStats, monthlyAbsent, pendingRegularizations] = await Promise.all([
      this.getLiveAttendance(orgId),
      this.prisma.attendanceRecord.count({ where: { orgId, date: { gte: monthStart }, status: 'ABSENT' } }),
      this.prisma.regularizationRequest.count({ where: { orgId, status: 'PENDING' } }),
    ]);
    return { today: todayStats.stats, monthlyAbsent, pendingRegularizations };
  }

  // Shifts
  async getShifts(orgId: string) { return this.prisma.shift.findMany({ where: { orgId }, orderBy: { name: 'asc' } }); }
  async createShift(orgId: string, dto: CreateShiftDto) { return this.prisma.shift.create({ data: { orgId, ...dto } }); }
  async updateShift(orgId: string, id: string, dto: Partial<CreateShiftDto>) {
    const s = await this.prisma.shift.findFirst({ where: { id, orgId } });
    if (!s) throw new NotFoundException('Shift not found');
    return this.prisma.shift.update({ where: { id }, data: dto });
  }
  async deleteShift(orgId: string, id: string) {
    const s = await this.prisma.shift.findFirst({ where: { id, orgId } });
    if (!s) throw new NotFoundException('Shift not found');
    await this.prisma.shift.delete({ where: { id } });
    return { message: 'Shift deleted' };
  }

  // Rosters
  async getRosters(orgId: string, date?: string) {
    const d = date ? new Date(date) : new Date(); d.setHours(0, 0, 0, 0);
    return this.prisma.roster.findMany({ where: { orgId, date: d }, include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } }, shift: true } });
  }
  async assignRoster(orgId: string, employeeId: string, shiftId: string, date: string) {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    return this.prisma.roster.upsert({ where: { orgId_employeeId_date: { orgId, employeeId, date: d } }, create: { orgId, employeeId, shiftId, date: d }, update: { shiftId } });
  }

  // Regularization
  async createRegularization(orgId: string, employeeId: string, dto: CreateRegularizationDto) {
    const date = new Date(dto.date); date.setHours(0, 0, 0, 0);
    return this.prisma.regularizationRequest.create({ data: { orgId, employeeId, date, requestedCheckIn: dto.requestedCheckIn ? new Date(dto.requestedCheckIn) : undefined, requestedCheckOut: dto.requestedCheckOut ? new Date(dto.requestedCheckOut) : undefined, reason: dto.reason } });
  }
  async getPendingRegularizations(orgId: string) {
    return this.prisma.regularizationRequest.findMany({ where: { orgId, status: 'PENDING' }, include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } }, orderBy: { createdAt: 'desc' } });
  }
  async approveRegularization(orgId: string, id: string, approvedBy: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
    const req = await this.prisma.regularizationRequest.findFirst({ where: { id, orgId } });
    if (!req) throw new NotFoundException('Request not found');
    await this.prisma.regularizationRequest.update({ where: { id }, data: { status, approvedBy, approverComments: comments, approvedAt: new Date() } });
    if (status === 'APPROVED' && req.requestedCheckIn) {
      const date = req.date; date.setHours(0, 0, 0, 0);
      await this.prisma.attendanceRecord.upsert({ where: { orgId_employeeId_date: { orgId, employeeId: req.employeeId, date } }, create: { orgId, employeeId: req.employeeId, date, checkIn: req.requestedCheckIn, checkOut: req.requestedCheckOut ?? undefined, status: 'PRESENT' }, update: { checkIn: req.requestedCheckIn, checkOut: req.requestedCheckOut ?? undefined, status: 'PRESENT' } });
    }
    return { message: `Regularization ${status.toLowerCase()}` };
  }
}
