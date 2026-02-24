import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GrievanceService } from './grievance.service';
import { CreateGrievanceDto } from './dto/create-grievance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('grievance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('grievance')
export class GrievanceController {
  constructor(private readonly svc: GrievanceService) {}

  @Get() getAll(@CurrentUser() u: JwtPayload, @Query() f: any) { return this.svc.getGrievances(u.orgId, f); }
  @Post() create(@CurrentUser() u: JwtPayload, @Body() dto: CreateGrievanceDto) { return this.svc.createGrievance(u.orgId, u.sub, dto); }
  @Patch(':id/assign') assign(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { assignedToId: string }) { return this.svc.assignGrievance(u.orgId, id, body.assignedToId); }
  @Patch(':id/resolve') resolve(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { resolution: string }) { return this.svc.resolveGrievance(u.orgId, id, body.resolution); }
  @Patch(':id/status') updateStatus(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { status: string }) { return this.svc.updateStatus(u.orgId, id, body.status); }
  @Get('dashboard/stats') getStats(@CurrentUser() u: JwtPayload) { return this.svc.getDashboardStats(u.orgId); }

  @Get('compliance') getCompliance(@CurrentUser() u: JwtPayload, @Query() f: PaginationDto) { return this.svc.getComplianceItems(u.orgId, f); }
  @Post('compliance') createCompliance(@CurrentUser() u: JwtPayload, @Body() body: any) { return this.svc.createComplianceItem(u.orgId, body); }
  @Patch('compliance/:id') updateCompliance(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: any) { return this.svc.updateComplianceItem(u.orgId, id, body); }

  @Get('incidents') getIncidents(@CurrentUser() u: JwtPayload, @Query() f: PaginationDto) { return this.svc.getIncidents(u.orgId, f); }
  @Post('incidents') createIncident(@CurrentUser() u: JwtPayload, @Body() body: any) { return this.svc.createIncident(u.orgId, u.sub, body); }
}
