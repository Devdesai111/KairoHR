import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { StorageService } from '../../storage/storage.service';

@ApiTags('organization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly svc: OrganizationService,
    private readonly storage: StorageService,
  ) {}

  @Get() @ApiOperation({ summary: 'Get org profile' })
  getOrg(@CurrentUser() u: JwtPayload) { return this.svc.getOrganization(u.orgId); }

  @Patch() @ApiOperation({ summary: 'Update org profile' })
  updateOrg(@CurrentUser() u: JwtPayload, @Body() dto: UpdateOrganizationDto) { return this.svc.updateOrganization(u.orgId, dto); }

  @Get('setup-progress') @ApiOperation({ summary: 'Onboarding progress %' })
  progress(@CurrentUser() u: JwtPayload) { return this.svc.getSetupProgress(u.orgId); }

  // Legal Entities
  @Get('entities') getLegalEntities(@CurrentUser() u: JwtPayload) { return this.svc.getLegalEntities(u.orgId); }
  @Post('entities') createLE(@CurrentUser() u: JwtPayload, @Body() dto: CreateLegalEntityDto) { return this.svc.createLegalEntity(u.orgId, dto); }
  @Patch('entities/:id') updateLE(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateLegalEntityDto>) { return this.svc.updateLegalEntity(u.orgId, id, dto); }
  @Delete('entities/:id') deleteLE(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteLegalEntity(u.orgId, id); }

  // Locations
  @Get('locations') getLocations(@CurrentUser() u: JwtPayload) { return this.svc.getLocations(u.orgId); }
  @Post('locations') createLoc(@CurrentUser() u: JwtPayload, @Body() dto: CreateLocationDto) { return this.svc.createLocation(u.orgId, dto); }
  @Patch('locations/:id') updateLoc(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateLocationDto>) { return this.svc.updateLocation(u.orgId, id, dto); }
  @Delete('locations/:id') deleteLoc(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteLocation(u.orgId, id); }

  // Departments
  @Get('departments') getDepts(@CurrentUser() u: JwtPayload) { return this.svc.getDepartments(u.orgId); }
  @Get('departments/tree') getDeptTree(@CurrentUser() u: JwtPayload) { return this.svc.getDepartmentTree(u.orgId); }
  @Post('departments') createDept(@CurrentUser() u: JwtPayload, @Body() dto: CreateDepartmentDto) { return this.svc.createDepartment(u.orgId, dto); }
  @Patch('departments/:id') updateDept(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateDepartmentDto>) { return this.svc.updateDepartment(u.orgId, id, dto); }
  @Delete('departments/:id') deleteDept(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteDepartment(u.orgId, id); }

  // Policies
  @Get('policies') getPolicies(@CurrentUser() u: JwtPayload) { return this.svc.getPolicies(u.orgId); }

  @Post('policies')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' }, file: { type: 'string', format: 'binary' } } } })
  async createPolicy(
    @CurrentUser() u: JwtPayload,
    @Body() body: { name: string; type?: string; description?: string },
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), new FileTypeValidator({ fileType: /(pdf|doc|docx)$/ })], fileIsRequired: false })) file?: Express.Multer.File,
  ) {
    let fileUrl: string | undefined, fileKey: string | undefined;
    if (file) {
      const up = await this.storage.uploadFile(file.buffer, file.originalname, file.mimetype, 'policies');
      fileUrl = up.url; fileKey = up.key;
    }
    return this.svc.createPolicy(u.orgId, { name: body.name, type: body.type, description: body.description, fileUrl, fileKey, createdBy: u.sub });
  }

  @Delete('policies/:id') deletePolicy(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deletePolicy(u.orgId, id); }
}
