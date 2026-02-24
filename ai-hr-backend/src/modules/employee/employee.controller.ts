import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, Query, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { StorageService } from '../../storage/storage.service';

@ApiTags('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly svc: EmployeeService, private readonly storage: StorageService) {}

  @Get() @ApiOperation({ summary: 'List employees (paginated, filterable)' })
  findAll(@CurrentUser() u: JwtPayload, @Query() filter: EmployeeFilterDto) {
    return this.svc.findAll(u.orgId, filter);
  }

  @Get('onboarding/pipeline') @ApiOperation({ summary: 'Onboarding pipeline' })
  onboardingPipeline(@CurrentUser() u: JwtPayload) { return this.svc.getOnboardingPipeline(u.orgId); }

  @Get(':id') @ApiOperation({ summary: 'Get employee profile' })
  findOne(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.findOne(u.orgId, id); }

  @Post() @ApiOperation({ summary: 'Create employee' })
  create(@CurrentUser() u: JwtPayload, @Body() dto: CreateEmployeeDto) { return this.svc.create(u.orgId, dto, u.sub); }

  @Patch(':id') @ApiOperation({ summary: 'Update employee' })
  update(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) { return this.svc.update(u.orgId, id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Deactivate employee' })
  remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.softDelete(u.orgId, id); }

  @Get(':id/org-chart') @ApiOperation({ summary: 'Reporting hierarchy' })
  orgChart(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getOrgChart(u.orgId, id); }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { type: { type: 'string' }, name: { type: 'string' }, file: { type: 'string', format: 'binary' } } } })
  async uploadDoc(
    @CurrentUser() u: JwtPayload, @Param('id') id: string,
    @Body() body: { type: string; name: string },
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 })], fileIsRequired: true })) file: Express.Multer.File,
  ) {
    const up = await this.storage.uploadFile(file.buffer, file.originalname, file.mimetype, `employees/${id}/documents`);
    return this.svc.uploadDocument(u.orgId, id, { type: body.type, name: body.name, fileUrl: up.url, fileKey: up.key, uploadedBy: u.sub });
  }

  @Get(':id/documents') @ApiOperation({ summary: 'List employee documents' })
  getDocs(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getDocuments(u.orgId, id); }

  @Get(':id/onboarding-tasks') getOnboardingTasks(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getOnboardingTasks(u.orgId, id); }

  @Patch('onboarding-tasks/:taskId')
  updateOnboardingTask(@Param('taskId') taskId: string, @Body() body: { status: string }) { return this.svc.completeOnboardingTask(taskId, body.status); }

  @Post(':id/offboarding/initiate')
  initiateOffboarding(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { exitDate: string }) {
    return this.svc.initiateOffboarding(u.orgId, id, new Date(body.exitDate));
  }

  @Get(':id/offboarding-tasks') getOffboardingTasks(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getOffboardingTasks(u.orgId, id); }

  @Patch(':id/bank-details')
  updateBankDetails(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.updateBankDetails(u.orgId, id, body);
  }
}
