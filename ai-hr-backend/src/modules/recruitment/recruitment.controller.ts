import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('recruitment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly svc: RecruitmentService) {}

  // Jobs
  @Get('jobs') getJobs(@CurrentUser() u: JwtPayload, @Query() f: PaginationDto & { status?: string }) { return this.svc.getJobs(u.orgId, f); }
  @Get('jobs/:id') getJob(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getJob(u.orgId, id); }
  @Post('jobs') createJob(@CurrentUser() u: JwtPayload, @Body() dto: CreateJobDto) { return this.svc.createJob(u.orgId, dto, u.sub); }
  @Patch('jobs/:id') updateJob(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateJobDto>) { return this.svc.updateJob(u.orgId, id, dto); }
  @Post('jobs/:id/publish') publishJob(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.publishJob(u.orgId, id); }
  @Post('jobs/:id/close') closeJob(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.closeJob(u.orgId, id); }

  // Candidates
  @Get('candidates') getCandidates(@CurrentUser() u: JwtPayload, @Query() f: PaginationDto) { return this.svc.getCandidates(u.orgId, f); }
  @Post('candidates') createCandidate(@CurrentUser() u: JwtPayload, @Body() dto: CreateCandidateDto) { return this.svc.createCandidate(u.orgId, dto); }
  @Patch('candidates/:id') updateCandidate(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() dto: Partial<CreateCandidateDto>) { return this.svc.updateCandidate(u.orgId, id, dto); }

  // Applications
  @Get('applications') getApps(@CurrentUser() u: JwtPayload, @Query('jobId') jobId?: string) { return this.svc.getApplications(u.orgId, jobId); }
  @Post('applications') apply(@CurrentUser() u: JwtPayload, @Body() body: { jobId: string; candidateId: string; source?: string }) { return this.svc.applyCandidate(body.jobId, body.candidateId, body.source); }
  @Patch('applications/:id/stage') moveStage(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { stage: string; notes?: string }) { return this.svc.moveStage(u.orgId, id, body.stage, body.notes); }

  // Interviews
  @Post('interviews') scheduleInterview(@Body() body: { applicationId: string; type: string; interviewerId?: string; scheduledAt: string; durationMinutes?: number; meetingLink?: string; round?: number }) { return this.svc.scheduleInterview(body.applicationId, body); }
  @Post('interviews/:id/feedback') submitFeedback(@Param('id') id: string, @Body() body: { feedback: string; rating: number; decision: string }) { return this.svc.submitFeedback(id, body); }

  // Offers
  @Post('offers') createOffer(@Body() body: { applicationId: string; designation: string; ctc: number; joiningDate?: string; terms?: Record<string, unknown> }) { return this.svc.createOffer(body.applicationId, body); }
  @Post('offers/:id/send') sendOffer(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.sendOffer(u.orgId, id); }

  @Get('analytics') getAnalytics(@CurrentUser() u: JwtPayload) { return this.svc.getAnalytics(u.orgId); }
}
