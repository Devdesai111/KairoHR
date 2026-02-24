import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { _count: { select: { employees: true, departments: true, locations: true } } },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateOrganization(orgId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({ where: { id: orgId }, data: dto });
  }

  async getSetupProgress(orgId: string) {
    const [org, depts, locations, employees, policies] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId } }),
      this.prisma.department.count({ where: { orgId } }),
      this.prisma.location.count({ where: { orgId } }),
      this.prisma.employee.count({ where: { orgId } }),
      this.prisma.hRPolicy.count({ where: { orgId } }),
    ]);
    const checks = [
      { key: 'orgProfile', label: 'Organization profile complete', done: !!org?.industry },
      { key: 'departments', label: 'Departments configured', done: depts > 0 },
      { key: 'locations', label: 'Locations added', done: locations > 0 },
      { key: 'employees', label: 'First employee added', done: employees > 0 },
      { key: 'policies', label: 'HR policies uploaded', done: policies > 0 },
    ];
    const completed = checks.filter((c) => c.done).length;
    return { percentage: Math.round((completed / checks.length) * 100), checks, completed, total: checks.length };
  }

  // Legal Entities
  async getLegalEntities(orgId: string) {
    return this.prisma.legalEntity.findMany({ where: { orgId }, include: { _count: { select: { locations: true } } }, orderBy: { createdAt: 'desc' } });
  }
  async createLegalEntity(orgId: string, dto: CreateLegalEntityDto) {
    return this.prisma.legalEntity.create({ data: { orgId, ...dto } });
  }
  async updateLegalEntity(orgId: string, id: string, dto: Partial<CreateLegalEntityDto>) {
    await this.findLegalEntityOrThrow(orgId, id);
    return this.prisma.legalEntity.update({ where: { id }, data: dto });
  }
  async deleteLegalEntity(orgId: string, id: string) {
    await this.findLegalEntityOrThrow(orgId, id);
    await this.prisma.legalEntity.delete({ where: { id } });
    return { message: 'Legal entity deleted' };
  }
  private async findLegalEntityOrThrow(orgId: string, id: string) {
    const e = await this.prisma.legalEntity.findFirst({ where: { id, orgId } });
    if (!e) throw new NotFoundException('Legal entity not found');
    return e;
  }

  // Locations
  async getLocations(orgId: string) {
    return this.prisma.location.findMany({ where: { orgId }, include: { legalEntity: { select: { id: true, name: true } } }, orderBy: { name: 'asc' } });
  }
  async createLocation(orgId: string, dto: CreateLocationDto) {
    return this.prisma.location.create({ data: { orgId, ...dto } });
  }
  async updateLocation(orgId: string, id: string, dto: Partial<CreateLocationDto>) {
    await this.findLocationOrThrow(orgId, id);
    return this.prisma.location.update({ where: { id }, data: dto });
  }
  async deleteLocation(orgId: string, id: string) {
    await this.findLocationOrThrow(orgId, id);
    await this.prisma.location.delete({ where: { id } });
    return { message: 'Location deleted' };
  }
  private async findLocationOrThrow(orgId: string, id: string) {
    const l = await this.prisma.location.findFirst({ where: { id, orgId } });
    if (!l) throw new NotFoundException('Location not found');
    return l;
  }

  // Departments
  async getDepartments(orgId: string) {
    return this.prisma.department.findMany({ where: { orgId }, include: { location: { select: { id: true, name: true } }, _count: { select: { children: true, employees: true } } }, orderBy: { name: 'asc' } });
  }
  async getDepartmentTree(orgId: string) {
    const all = await this.prisma.department.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
    type DeptWithChildren = (typeof all)[0] & { children: DeptWithChildren[] };
    const build = (items: typeof all, parentId: string | null = null): DeptWithChildren[] =>
      items.filter((d) => d.parentId === parentId).map((d) => ({ ...d, children: build(items, d.id) }));
    return build(all);
  }
  async createDepartment(orgId: string, dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { orgId, ...dto } });
  }
  async updateDepartment(orgId: string, id: string, dto: Partial<CreateDepartmentDto>) {
    await this.findDeptOrThrow(orgId, id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }
  async deleteDepartment(orgId: string, id: string) {
    await this.findDeptOrThrow(orgId, id);
    await this.prisma.department.delete({ where: { id } });
    return { message: 'Department deleted' };
  }
  private async findDeptOrThrow(orgId: string, id: string) {
    const d = await this.prisma.department.findFirst({ where: { id, orgId } });
    if (!d) throw new NotFoundException('Department not found');
    return d;
  }

  // Policies
  async getPolicies(orgId: string) {
    return this.prisma.hRPolicy.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }
  async createPolicy(orgId: string, data: { name: string; type?: string; description?: string; fileUrl?: string; fileKey?: string; effectiveDate?: Date; createdBy: string }) {
    return this.prisma.hRPolicy.create({ data: { orgId, ...data } });
  }
  async deletePolicy(orgId: string, id: string) {
    const p = await this.prisma.hRPolicy.findFirst({ where: { id, orgId } });
    if (!p) throw new NotFoundException('Policy not found');
    await this.prisma.hRPolicy.delete({ where: { id } });
    return { message: 'Policy deleted' };
  }
}
