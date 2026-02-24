import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';
import { encrypt, decrypt } from '../../common/utils/crypto.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private get encKey() { return this.config.get<string>('encryption.key') ?? 'default-32-char-key-change-this!!'; }

  private async genEmployeeId(orgId: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
    const prefix = (org?.name ?? 'ORG').substring(0, 3).toUpperCase();
    const count = await this.prisma.employee.count({ where: { orgId } });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(orgId: string, filter: EmployeeFilterDto): Promise<PaginatedResult<unknown>> {
    const { page = 1, pageSize = 20, search, departmentId, locationId, status, employmentType, designation, managerId } = filter;
    const where: Prisma.EmployeeWhereInput = { orgId, ...(status && { status }), ...(employmentType && { employmentType }), ...(departmentId && { departmentId }), ...(locationId && { locationId }), ...(designation && { designation: { contains: designation, mode: 'insensitive' } }), ...(managerId && { reportingManagerId: managerId }), ...(search && { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { employeeId: { contains: search, mode: 'insensitive' } }] }) };
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, include: { department: { select: { id: true, name: true } }, location: { select: { id: true, name: true } }, reportingManager: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.employee.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async findOne(orgId: string, id: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id, orgId }, include: { department: true, location: true, reportingManager: { select: { id: true, firstName: true, lastName: true, designation: true } }, user: { select: { id: true, email: true, status: true, lastLogin: true } }, documents: { orderBy: { createdAt: 'desc' } } } });
    if (!emp) throw new NotFoundException('Employee not found');
    const result: Record<string, unknown> = { ...emp };
    if (emp.bankDetails) {
      try { result['bankDetails'] = JSON.parse(decrypt(emp.bankDetails, this.encKey)); } catch { result['bankDetails'] = null; }
    }
    return result;
  }

  async create(orgId: string, dto: CreateEmployeeDto, createdBy: string) {
    const exists = await this.prisma.employee.findFirst({ where: { orgId, email: dto.email } });
    if (exists) throw new ConflictException('Employee with this email already exists');
    const employeeId = await this.genEmployeeId(orgId);
    return this.prisma.employee.create({
      data: {
        orgId,
        employeeId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        designation: dto.designation,
        departmentId: dto.departmentId,
        locationId: dto.locationId,
        reportingManagerId: dto.reportingManagerId,
        dateOfJoining: new Date(dto.dateOfJoining),
        employmentType: dto.employmentType ?? 'FULL_TIME',
        // Prisma JSON fields – cast to any to satisfy types
        personalDetails: (dto.personalDetails ?? {}) as any,
        emergencyContacts: (dto.emergencyContacts ?? []) as any,
        status: 'ACTIVE',
      },
      include: { department: { select: { id: true, name: true } }, location: { select: { id: true, name: true } } },
    });
  }

  async update(orgId: string, id: string, dto: UpdateEmployeeDto) {
    const emp = await this.prisma.employee.findFirst({ where: { id, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const data: Prisma.EmployeeUpdateInput = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.designation !== undefined) data.designation = dto.designation;
    if (dto.departmentId !== undefined) data.department = dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true };
    if (dto.locationId !== undefined) data.location = dto.locationId ? { connect: { id: dto.locationId } } : { disconnect: true };
    if (dto.reportingManagerId !== undefined) data.reportingManager = dto.reportingManagerId ? { connect: { id: dto.reportingManagerId } } : { disconnect: true };
    if (dto.status) data.status = dto.status;
    if (dto.dateOfExit) data.dateOfExit = new Date(dto.dateOfExit);
    if (dto.gender) data.gender = dto.gender;
    if (dto.employmentType) data.employmentType = dto.employmentType;
    if (dto.personalDetails) data.personalDetails = dto.personalDetails as any;
    return this.prisma.employee.update({ where: { id }, data });
  }

  async softDelete(orgId: string, id: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    await this.prisma.employee.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { message: 'Employee deactivated' };
  }

  async getOrgChart(orgId: string, employeeId: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId }, include: { reportingManager: { include: { reportingManager: { select: { id: true, firstName: true, lastName: true, designation: true } } } }, subordinates: { select: { id: true, firstName: true, lastName: true, designation: true, profileImageUrl: true, _count: { select: { subordinates: true } } } } } });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async uploadDocument(orgId: string, employeeId: string, data: { type: string; name: string; fileUrl: string; fileKey?: string; expiryDate?: Date; uploadedBy: string }) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    return this.prisma.employeeDocument.create({ data: { employeeId, ...data } });
  }

  async getDocuments(orgId: string, employeeId: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    return this.prisma.employeeDocument.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }

  async getOnboardingPipeline(orgId: string) {
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    const past30 = new Date(); past30.setDate(past30.getDate() - 30);
    return this.prisma.employee.findMany({
      where: { orgId, status: 'ACTIVE', dateOfJoining: { gte: past30, lte: thirtyDays } },
      include: { department: { select: { id: true, name: true } }, onboardingTasks: true },
      orderBy: { dateOfJoining: 'asc' },
    });
  }

  async getOnboardingTasks(orgId: string, employeeId: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    return this.prisma.onboardingTask.findMany({ where: { employeeId }, orderBy: { dueDate: 'asc' } });
  }

  async completeOnboardingTask(taskId: string, status: string) {
    return this.prisma.onboardingTask.update({ where: { id: taskId }, data: { status, completedAt: status === 'COMPLETED' ? new Date() : null } });
  }

  async initiateOffboarding(orgId: string, employeeId: string, exitDate: Date) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const tasks = [
      { taskType: 'IT_ASSETS', title: 'Return IT assets (laptop, accessories)' },
      { taskType: 'KNOWLEDGE_TRANSFER', title: 'Complete knowledge transfer documentation' },
      { taskType: 'EXIT_INTERVIEW', title: 'Complete exit interview' },
      { taskType: 'FINAL_SETTLEMENT', title: 'Process final settlement' },
      { taskType: 'ACCESS_REVOCATION', title: 'Revoke system access' },
      { taskType: 'NOC', title: 'Issue No Objection Certificate' },
    ];
    await this.prisma.$transaction([
      this.prisma.employee.update({ where: { id: employeeId }, data: { status: 'ON_NOTICE', dateOfExit: exitDate } }),
      ...tasks.map(t => this.prisma.offboardingTask.create({ data: { employeeId, ...t, dueDate: exitDate } })),
    ]);
    return { message: 'Offboarding initiated', tasks: tasks.length };
  }

  async getOffboardingTasks(orgId: string, employeeId: string) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    return this.prisma.offboardingTask.findMany({ where: { employeeId }, orderBy: { dueDate: 'asc' } });
  }

  async updateBankDetails(orgId: string, employeeId: string, bankDetails: Record<string, unknown>) {
    const emp = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const encrypted = encrypt(JSON.stringify(bankDetails), this.encKey);
    await this.prisma.employee.update({ where: { id: employeeId }, data: { bankDetails: encrypted } });
    return { message: 'Bank details updated securely' };
  }
}
