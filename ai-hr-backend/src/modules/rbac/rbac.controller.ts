import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('rbac')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('roles')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @ApiOperation({ summary: 'List all roles for org' })
  getRoles(@CurrentUser() user: JwtPayload) {
    return this.rbacService.getRoles(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom role' })
  createRole(@CurrentUser() user: JwtPayload, @Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(user.orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role' })
  updateRole(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(user.orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom role' })
  deleteRole(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.rbacService.deleteRole(user.orgId, id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: "Get role's permissions" })
  getRolePermissions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.rbacService.getRolePermissions(user.orgId, id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Set role permissions (bulk replace)' })
  setRolePermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.rbacService.setRolePermissions(user.orgId, id, dto.permissionIds);
  }

  @Get('permissions/all')
  @ApiOperation({ summary: 'List all available permissions grouped by module' })
  getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Get('permissions/matrix')
  @ApiOperation({ summary: 'Full access matrix for UI' })
  getAccessMatrix(@CurrentUser() user: JwtPayload) {
    return this.rbacService.getAccessMatrix(user.orgId);
  }

  @Post('users/:userId/assign/:roleId')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rbacService.assignRoleToUser(user.orgId, userId, roleId);
  }

  @Delete('users/:userId/remove/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rbacService.removeRoleFromUser(user.orgId, userId, roleId);
  }
}
