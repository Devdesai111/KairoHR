import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';
import { ChatMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('ai')
export class AiAssistantController {
  constructor(private readonly svc: AiAssistantService) {}

  @Post('chat') @ApiOperation({ summary: 'Send message to AI HR Assistant' })
  chat(@CurrentUser() u: JwtPayload, @Body() dto: ChatMessageDto) { return this.svc.chat(u.orgId, u.sub, dto.message, dto.sessionId); }

  @Get('chat/sessions') getSessions(@CurrentUser() u: JwtPayload) { return this.svc.getSessions(u.orgId, u.sub); }
  @Get('chat/sessions/:id') getSession(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.getSessionHistory(u.orgId, u.sub, id); }
  @Delete('chat/sessions/:id') deleteSession(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteSession(u.orgId, u.sub, id); }

  @Post('policy-qa') @ApiOperation({ summary: 'Ask a policy question (RAG)' })
  policyQA(@CurrentUser() u: JwtPayload, @Body() body: { question: string }) { return this.svc.policyQA(u.orgId, body.question); }

  @Get('insights') @ApiOperation({ summary: 'Get AI-generated HR insights' })
  getInsights(@CurrentUser() u: JwtPayload) { return this.svc.generateInsights(u.orgId); }

  @Get('documents') getKBDocs(@CurrentUser() u: JwtPayload) { return this.svc.getKBDocuments(u.orgId); }
  @Post('documents') addKBDoc(@CurrentUser() u: JwtPayload, @Body() body: { title: string; type: string; content?: string; fileUrl?: string }) { return this.svc.addKBDocument(u.orgId, body); }
  @Delete('documents/:id') deleteKBDoc(@CurrentUser() u: JwtPayload, @Param('id') id: string) { return this.svc.deleteKBDocument(u.orgId, id); }
}
