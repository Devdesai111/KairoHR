import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class MeetingService {
  constructor(private prisma: PrismaService) {}

  async getMyMeetings(orgId: string, employeeId: string, filter: PaginationDto) {
    const { page = 1, pageSize = 20 } = filter;
    const where = { orgId, participants: { some: { employeeId } } };
    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({ where, skip: (page-1)*pageSize, take: pageSize, include: { participants: { include: { employee: { select: { id:true,firstName:true,lastName:true,profileImageUrl:true } } } }, room: { select: { id:true,name:true } } }, orderBy: { startTime: 'asc' } }),
      this.prisma.meeting.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async getMeetings(orgId: string, filter: PaginationDto & { from?: string; to?: string }) {
    const { page = 1, pageSize = 20, from, to } = filter;
    const where: any = { orgId, ...(from || to ? { startTime: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}) };
    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({ where, skip: (page-1)*pageSize, take: pageSize, include: { participants: { include: { employee: { select: { id:true,firstName:true,lastName:true } } } }, room: { select: { id:true,name:true,capacity:true } } }, orderBy: { startTime: 'asc' } }),
      this.prisma.meeting.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async createMeeting(orgId: string, organizerId: string, dto: CreateMeetingDto) {
    const participantIds = dto.participantIds ?? [];
    if (!participantIds.includes(organizerId)) participantIds.push(organizerId);
    return this.prisma.meeting.create({
      data: {
        orgId, title: dto.title, description: dto.description, organizerId,
        roomId: dto.roomId, startTime: new Date(dto.startTime), endTime: new Date(dto.endTime),
        meetingLink: dto.meetingLink, agenda: dto.agenda,
        isRecurring: dto.isRecurring ?? false, recurrenceRule: dto.recurrenceRule,
        participants: { create: participantIds.map(empId => ({ employeeId: empId, isOrganizer: empId === organizerId })) },
      },
      include: { participants: { include: { employee: { select: { id:true,firstName:true,lastName:true } } } } },
    });
  }

  async updateMeeting(orgId: string, id: string, dto: Partial<CreateMeetingDto>) {
    const m = await this.prisma.meeting.findFirst({ where: { id, orgId } });
    if (!m) throw new NotFoundException('Meeting not found');
    return this.prisma.meeting.update({ where: { id }, data: { ...dto, startTime: dto.startTime ? new Date(dto.startTime) : undefined, endTime: dto.endTime ? new Date(dto.endTime) : undefined } });
  }

  async cancelMeeting(orgId: string, id: string) {
    const m = await this.prisma.meeting.findFirst({ where: { id, orgId } });
    if (!m) throw new NotFoundException('Meeting not found');
    return this.prisma.meeting.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getCalendar(orgId: string, year: number, month: number) {
    const from = new Date(year, month-1, 1); const to = new Date(year, month, 0, 23, 59, 59);
    return this.prisma.meeting.findMany({ where: { orgId, startTime: { gte: from, lte: to } }, include: { participants: { include: { employee: { select: { id:true,firstName:true,lastName:true } } } } }, orderBy: { startTime: 'asc' } });
  }

  async getRooms(orgId: string) { return this.prisma.meetingRoom.findMany({ where: { orgId, isActive: true }, orderBy: { name: 'asc' } }); }
  async createRoom(orgId: string, data: { name: string; capacity?: number; locationId?: string; facilities?: Record<string, unknown> }) { return this.prisma.meetingRoom.create({ data: { orgId, ...data } }); }
  async updateRoom(orgId: string, id: string, data: Partial<{ name: string; capacity: number; facilities: Record<string, unknown>; isActive: boolean }>) {
    const r = await this.prisma.meetingRoom.findFirst({ where: { id, orgId } });
    if (!r) throw new NotFoundException('Room not found');
    return this.prisma.meetingRoom.update({ where: { id }, data });
  }

  async getAnalytics(orgId: string) {
    const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, thisMonth, byStatus] = await Promise.all([
      this.prisma.meeting.count({ where: { orgId } }),
      this.prisma.meeting.count({ where: { orgId, startTime: { gte: monthStart } } }),
      this.prisma.meeting.groupBy({ by: ['status'], where: { orgId }, _count: { id: true } }),
    ]);
    return { total, thisMonth, byStatus };
  }
}
