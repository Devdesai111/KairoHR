import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // Jobs
  async getJobs(orgId: string, filter: PaginationDto & { status?: string }) {
    const { page = 1, pageSize = 20, search, status } = filter;
    const where: Prisma.JobRequisitionWhereInput = { orgId, ...(status && { status: status as any }), ...(search && { title: { contains: search, mode: 'insensitive' } }) };
    const [data, total] = await Promise.all([
      this.prisma.jobRequisition.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.jobRequisition.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }
  async getJob(orgId: string, id: string) {
    const j = await this.prisma.jobRequisition.findFirst({ where: { id, orgId }, include: { _count: { select: { applications: true } } } });
    if (!j) throw new NotFoundException('Job not found');
    return j;
  }
  async createJob(orgId: string, dto: CreateJobDto, createdBy: string) {
    return this.prisma.jobRequisition.create({ data: { orgId, title: dto.title, departmentId: dto.departmentId, locationId: dto.locationId, employmentType: dto.employmentType ?? 'FULL_TIME', experienceMin: dto.experienceMin, experienceMax: dto.experienceMax, salaryRange: dto.salaryRange, description: dto.description, requirements: dto.requirements, openings: dto.openings ?? 1, hiringManagerId: dto.hiringManagerId, recruiterId: createdBy, closingDate: dto.closingDate ? new Date(dto.closingDate) : undefined } });
  }
  async updateJob(orgId: string, id: string, dto: Partial<CreateJobDto>) {
    const j = await this.prisma.jobRequisition.findFirst({ where: { id, orgId } });
    if (!j) throw new NotFoundException('Job not found');
    return this.prisma.jobRequisition.update({ where: { id }, data: { ...dto, closingDate: dto.closingDate ? new Date(dto.closingDate) : undefined } });
  }
  async publishJob(orgId: string, id: string) {
    const j = await this.prisma.jobRequisition.findFirst({ where: { id, orgId } });
    if (!j) throw new NotFoundException('Job not found');
    return this.prisma.jobRequisition.update({ where: { id }, data: { status: 'OPEN' } });
  }
  async closeJob(orgId: string, id: string) {
    return this.prisma.jobRequisition.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  // Candidates
  async getCandidates(orgId: string, filter: PaginationDto & { search?: string }) {
    const { page = 1, pageSize = 20, search } = filter;
    const where: Prisma.CandidateWhereInput = { orgId, ...(search && { OR: [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }) };
    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.candidate.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }
  async createCandidate(orgId: string, dto: CreateCandidateDto) {
    const existing = await this.prisma.candidate.findFirst({ where: { orgId, email: dto.email } });
    if (existing) throw new ConflictException('Candidate with this email already exists');
    return this.prisma.candidate.create({ data: { orgId, firstName: dto.firstName, lastName: dto.lastName, email: dto.email, phone: dto.phone, currentCompany: dto.currentCompany, currentDesignation: dto.currentDesignation, experienceYears: dto.experienceYears, expectedCtc: dto.expectedCtc, noticePeriod: dto.noticePeriod, skills: dto.skills ?? [], source: dto.source, linkedin: dto.linkedin, github: dto.github } });
  }
  async updateCandidate(orgId: string, id: string, dto: Partial<CreateCandidateDto>) {
    const c = await this.prisma.candidate.findFirst({ where: { id, orgId } });
    if (!c) throw new NotFoundException('Candidate not found');
    return this.prisma.candidate.update({ where: { id }, data: dto });
  }

  // Applications
  async applyCandidate(jobId: string, candidateId: string, source?: string) {
    const existing = await this.prisma.application.findFirst({ where: { jobId, candidateId } });
    if (existing) throw new ConflictException('Already applied');
    return this.prisma.application.create({ data: { jobId, candidateId, source }, include: { job: { select: { id: true, title: true } }, candidate: { select: { id: true, firstName: true, lastName: true, email: true } } } });
  }
  async moveStage(orgId: string, id: string, stage: string, notes?: string) {
    const app = await this.prisma.application.findFirst({ where: { id }, include: { job: { select: { orgId: true } } } });
    if (!app || app.job.orgId !== orgId) throw new NotFoundException('Application not found');
    return this.prisma.application.update({ where: { id }, data: { stage: stage as any, notes: notes ?? app.notes } });
  }
  async getApplications(orgId: string, jobId?: string) {
    return this.prisma.application.findMany({ where: { job: { orgId }, ...(jobId && { jobId }) }, include: { candidate: true, job: { select: { id: true, title: true } }, interviews: { orderBy: { scheduledAt: 'desc' }, take: 5 }, offers: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { appliedAt: 'desc' } });
  }

  // Interviews
  async scheduleInterview(appId: string, data: { type: string; interviewerId?: string; scheduledAt: string; durationMinutes?: number; meetingLink?: string; round?: number }) {
    return this.prisma.interview.create({ data: { applicationId: appId, type: data.type as any, interviewerId: data.interviewerId, scheduledAt: new Date(data.scheduledAt), durationMinutes: data.durationMinutes ?? 60, meetingLink: data.meetingLink, round: data.round ?? 1 } });
  }
  async submitFeedback(id: string, data: { feedback: string; rating: number; decision: string }) {
    return this.prisma.interview.update({ where: { id }, data: { feedback: data.feedback, rating: data.rating, decision: data.decision as any, status: 'COMPLETED' } });
  }

  // Offers
  async createOffer(appId: string, data: { designation: string; ctc: number; joiningDate?: string; terms?: Record<string, unknown> }) {
    return this.prisma.offer.create({
      data: {
        applicationId: appId,
        designation: data.designation,
        ctc: data.ctc,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        terms: (data.terms ?? {}) as any,
      },
    });
  }
  async sendOffer(orgId: string, offerId: string) {
    const o = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!o) throw new NotFoundException('Offer not found');
    return this.prisma.offer.update({ where: { id: offerId }, data: { status: 'SENT', sentAt: new Date(), expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  }

  async getAnalytics(orgId: string) {
    const [totalJobs, openJobs, totalCandidates, totalApplications, stageBreakdown] = await Promise.all([
      this.prisma.jobRequisition.count({ where: { orgId } }),
      this.prisma.jobRequisition.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.candidate.count({ where: { orgId } }),
      this.prisma.application.count({ where: { job: { orgId } } }),
      this.prisma.application.groupBy({ by: ['stage'], where: { job: { orgId } }, _count: { id: true } }),
    ]);
    return { totalJobs, openJobs, totalCandidates, totalApplications, stageBreakdown };
  }
}
