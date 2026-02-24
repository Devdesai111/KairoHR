import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class GrievanceService {
  constructor(private prisma: PrismaService) {}

  async getGrievances(orgId: string, filter: PaginationDto & { status?: string; priority?: string }) {
    const { page=1, pageSize=20, status, priority, search } = filter;
    const where: any = { orgId, ...(status && { status }), ...(priority && { priority }), ...(search && { OR: [{ subject: { contains: search, mode: 'insensitive' } }] }) };
    const [data, total] = await Promise.all([
      this.prisma.grievance.findMany({ where, skip:(page-1)*pageSize, take:pageSize, include: { employee: { select: { id:true,firstName:true,lastName:true } }, assignedTo: { select: { id:true,firstName:true,lastName:true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.grievance.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async createGrievance(orgId: string, employeeId: string, dto: CreateGrievanceDto) {
    return this.prisma.grievance.create({ data: { orgId, employeeId: dto.isAnonymous ? undefined : employeeId, subject: dto.subject, description: dto.description, category: dto.category, priority: dto.priority ?? 'MEDIUM', isAnonymous: dto.isAnonymous ?? false } });
  }

  async assignGrievance(orgId: string, id: string, assignedToId: string) {
    const g = await this.prisma.grievance.findFirst({ where: { id, orgId } });
    if (!g) throw new NotFoundException('Grievance not found');
    return this.prisma.grievance.update({ where: { id }, data: { assignedToId, status: 'IN_PROGRESS' } });
  }

  async resolveGrievance(orgId: string, id: string, resolution: string) {
    const g = await this.prisma.grievance.findFirst({ where: { id, orgId } });
    if (!g) throw new NotFoundException('Grievance not found');
    return this.prisma.grievance.update({ where: { id }, data: { resolution, status: 'RESOLVED', resolvedAt: new Date() } });
  }

  async updateStatus(orgId: string, id: string, status: string) {
    const g = await this.prisma.grievance.findFirst({ where: { id, orgId } });
    if (!g) throw new NotFoundException('Grievance not found');
    return this.prisma.grievance.update({ where: { id }, data: { status: status as any } });
  }

  async getDashboardStats(orgId: string) {
    const [total, open, inProgress, resolved, byPriority] = await Promise.all([
      this.prisma.grievance.count({ where: { orgId } }),
      this.prisma.grievance.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.grievance.count({ where: { orgId, status: 'IN_PROGRESS' } }),
      this.prisma.grievance.count({ where: { orgId, status: 'RESOLVED' } }),
      this.prisma.grievance.groupBy({ by: ['priority'], where: { orgId }, _count: { id: true } }),
    ]);
    return { total, open, inProgress, resolved, byPriority };
  }

  // Compliance Items
  async getComplianceItems(orgId: string, filter: PaginationDto) {
    const { page=1, pageSize=20 } = filter;
    const [data, total] = await Promise.all([
      this.prisma.complianceItem.findMany({ where: { orgId }, skip:(page-1)*pageSize, take:pageSize, orderBy: { dueDate: 'asc' } }),
      this.prisma.complianceItem.count({ where: { orgId } }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async createComplianceItem(orgId: string, data: { title: string; category: string; description?: string; dueDate?: Date; priority?: string; assignedTo?: string }) {
    return this.prisma.complianceItem.create({ data: { orgId, ...data } });
  }

  async updateComplianceItem(orgId: string, id: string, data: Partial<{ status: string; notes: string; completedAt: Date }>) {
    const item = await this.prisma.complianceItem.findFirst({ where: { id, orgId } });
    if (!item) throw new NotFoundException('Compliance item not found');
    return this.prisma.complianceItem.update({ where: { id }, data });
  }

  // Incident Reports
  async getIncidents(orgId: string, filter: PaginationDto) {
    const { page=1, pageSize=20 } = filter;
    const [data, total] = await Promise.all([
      this.prisma.incidentReport.findMany({ where: { orgId }, skip:(page-1)*pageSize, take:pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.incidentReport.count({ where: { orgId } }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async createIncident(orgId: string, reportedBy: string, data: { title: string; description: string; type: string; severity?: string; location?: string }) {
    return this.prisma.incidentReport.create({ data: { orgId, reportedBy, ...data } });
  }
}
