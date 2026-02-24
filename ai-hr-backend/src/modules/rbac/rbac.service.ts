import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async getRoles(orgId: string) {
    return this.prisma.role.findMany({
      where: { orgId },
      include: {
        _count: { select: { userRoles: true, rolePermissions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createRole(orgId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { orgId, name: dto.name },
    });
    if (existing) throw new ConflictException('Role with this name already exists');

    return this.prisma.role.create({
      data: { orgId, name: dto.name, description: dto.description, type: 'CUSTOM' },
    });
  }

  async updateRole(orgId: string, roleId: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, orgId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.type === 'SYSTEM') throw new ForbiddenException('System roles cannot be modified');

    return this.prisma.role.update({
      where: { id: roleId },
      data: dto,
    });
  }

  async deleteRole(orgId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, orgId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.type === 'SYSTEM') throw new ForbiddenException('System roles cannot be deleted');

    await this.prisma.role.delete({ where: { id: roleId } });
    return { message: 'Role deleted' };
  }

  async getRolePermissions(orgId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, orgId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role.rolePermissions.map((rp) => rp.permission);
  }

  async setRolePermissions(orgId: string, roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, orgId } });
    if (!role) throw new NotFoundException('Role not found');

    // Validate permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('Some permissions not found');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);

    return { message: 'Permissions updated', count: permissionIds.length };
  }

  async getAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Group by module
    const grouped = permissions.reduce(
      (acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    return grouped;
  }

  async getAccessMatrix(orgId: string) {
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        where: { orgId },
        include: {
          rolePermissions: { include: { permission: true } },
        },
      }),
      this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] }),
    ]);

    return {
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        permissions: r.rolePermissions.map((rp) => `${rp.permission.module}.${rp.permission.action}`),
      })),
      permissions: permissions.map((p) => ({
        id: p.id,
        key: `${p.module}.${p.action}`,
        module: p.module,
        action: p.action,
        description: p.description,
      })),
    };
  }

  async assignRoleToUser(orgId: string, userId: string, roleId: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: userId, orgId } }),
      this.prisma.role.findFirst({ where: { id: roleId, orgId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
    return { message: 'Role assigned' };
  }

  async removeRoleFromUser(orgId: string, userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return { message: 'Role removed' };
  }
}
