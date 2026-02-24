import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private client: Anthropic | null = null;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    const apiKey = this.config.get<string>('anthropic.apiKey');
    if (apiKey) this.client = new Anthropic({ apiKey });
    else this.logger.warn('ANTHROPIC_API_KEY not set — AI features disabled');
  }

  async chat(orgId: string, userId: string, message: string, sessionId?: string): Promise<{ sessionId: string; response: string; tokens: number }> {
    // Get or create session
    let session = sessionId
      ? await this.prisma.chatSession.findFirst({ where: { id: sessionId, orgId, userId } })
      : null;

    if (!session) {
      session = await this.prisma.chatSession.create({ data: { orgId, userId, title: message.substring(0, 50) } });
    }

    // Save user message
    await this.prisma.chatMessage.create({ data: { sessionId: session.id, role: 'user', content: message } });

    // Get recent history
    const history = await this.prisma.chatMessage.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: 'asc' }, take: 20 });

    // Get org context
    const [org, totalEmployees, pendingLeaves] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, industry: true } }),
      this.prisma.employee.count({ where: { orgId, status: 'ACTIVE' } }),
      this.prisma.leaveApplication.count({ where: { orgId, status: 'PENDING' } }),
    ]);

    const systemPrompt = `You are an expert HR assistant for ${org?.name ?? 'the organization'} (${org?.industry ?? 'Technology'} industry).

Current HR Context:
- Total active employees: ${totalEmployees}
- Pending leave approvals: ${pendingLeaves}

You help HR professionals and employees with:
- HR policies and procedures
- Leave management queries
- Attendance and payroll questions
- Employee onboarding/offboarding guidance
- Compliance and statutory requirements (Indian labor law, PF, ESI, PT, TDS)
- Recruitment process guidance
- Performance management

Always be professional, accurate, and cite specific policies when available. If you don't know something, say so clearly.`;

    if (!this.client) {
      const mockResp = `I'm the AI HR Assistant. I received your message: "${message}". The AI integration requires an ANTHROPIC_API_KEY to be configured. Once set up, I can help with HR queries, policy questions, and more.`;
      await this.prisma.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: mockResp, tokens: 0 } });
      return { sessionId: session.id, response: mockResp, tokens: 0 };
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }));
    if (!messages.find(m => m.role === 'user' && m.content === message)) {
      messages.push({ role: 'user', content: message });
    }

    const response = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokens = response.usage.input_tokens + response.usage.output_tokens;

    await this.prisma.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: assistantMessage, tokens } });

    return { sessionId: session.id, response: assistantMessage, tokens };
  }

  async getSessions(orgId: string, userId: string) {
    return this.prisma.chatSession.findMany({ where: { orgId, userId }, include: { _count: { select: { messages: true } } }, orderBy: { updatedAt: 'desc' }, take: 20 });
  }

  async getSessionHistory(orgId: string, userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({ where: { id: sessionId, orgId, userId } });
    if (!session) return null;
    const messages = await this.prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
    return { session, messages };
  }

  async deleteSession(orgId: string, userId: string, sessionId: string) {
    await this.prisma.chatSession.deleteMany({ where: { id: sessionId, orgId, userId } });
    return { message: 'Session deleted' };
  }

  async getKBDocuments(orgId: string) {
    return this.prisma.kBDocument.findMany({ where: { orgId, isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  async addKBDocument(orgId: string, data: { title: string; type: string; content?: string; fileUrl?: string; fileKey?: string }) {
    const doc = await this.prisma.kBDocument.create({ data: { orgId, ...data } });
    if (data.content) await this.chunkDocument(doc.id, data.content);
    return doc;
  }

  private async chunkDocument(documentId: string, content: string) {
    const CHUNK_SIZE = 1000; const OVERLAP = 200;
    const chunks: string[] = [];
    let i = 0;
    while (i < content.length) {
      chunks.push(content.slice(i, i + CHUNK_SIZE));
      i += CHUNK_SIZE - OVERLAP;
    }
    await this.prisma.kBChunk.createMany({ data: chunks.map((c, idx) => ({ documentId, content: c, chunkIndex: idx })) });
  }

  async deleteKBDocument(orgId: string, id: string) {
    await this.prisma.kBDocument.updateMany({ where: { id, orgId }, data: { isActive: false } });
    return { message: 'Document removed from knowledge base' };
  }

  async policyQA(orgId: string, question: string): Promise<{ answer: string; sources: string[] }> {
    // Search KB for relevant chunks
    const chunks = await this.prisma.kBChunk.findMany({
      where: { document: { orgId, isActive: true } },
      include: { document: { select: { title: true, type: true } } },
      take: 5,
    });

    const context = chunks.map(c => `[${c.document.title}]: ${c.content}`).join('\n\n');
    const sources = [...new Set(chunks.map(c => c.document.title))];

    if (!this.client) return { answer: 'AI not configured. Please set ANTHROPIC_API_KEY.', sources: [] };

    const response = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      system: 'You are an HR policy expert. Answer questions based on the provided HR policies. If the answer is not in the provided context, say so clearly.',
      messages: [{ role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer based on the policies above:` }],
    });

    const answer = response.content[0].type === 'text' ? response.content[0].text : 'Unable to answer';
    return { answer, sources };
  }

  async generateInsights(orgId: string): Promise<{ insights: Array<{ type: string; title: string; description: string; severity: string }> }> {
    const [totalEmp, pendingLeaves, pendingGrievances, pendingReg, upcomingExits] = await Promise.all([
      this.prisma.employee.count({ where: { orgId, status: 'ACTIVE' } }),
      this.prisma.leaveApplication.count({ where: { orgId, status: 'PENDING' } }),
      this.prisma.grievance.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.regularizationRequest.count({ where: { orgId, status: 'PENDING' } }),
      this.prisma.employee.count({ where: { orgId, status: 'ON_NOTICE' } }),
    ]);

    const insights: Array<{ type: string; title: string; description: string; severity: string }> = [];

    if (pendingLeaves > 5) insights.push({ type: 'ACTION_REQUIRED', title: 'Pending Leave Approvals', description: `${pendingLeaves} leave applications are pending approval. Review and action them promptly.`, severity: 'HIGH' });
    if (pendingGrievances > 0) insights.push({ type: 'ALERT', title: 'Open Grievances', description: `${pendingGrievances} grievance(s) need attention. Unresolved grievances can affect morale.`, severity: pendingGrievances > 3 ? 'HIGH' : 'MEDIUM' });
    if (upcomingExits > 0) insights.push({ type: 'INFO', title: 'Upcoming Exits', description: `${upcomingExits} employee(s) are on notice period. Ensure knowledge transfer is planned.`, severity: 'MEDIUM' });
    if (pendingReg > 3) insights.push({ type: 'ACTION_REQUIRED', title: 'Attendance Regularizations Pending', description: `${pendingReg} regularization requests are awaiting review.`, severity: 'LOW' });
    if (totalEmp > 0 && pendingLeaves / totalEmp > 0.1) insights.push({ type: 'TREND', title: 'High Leave Pending Rate', description: `More than 10% of your team has pending leave requests. Consider delegating approval authority.`, severity: 'MEDIUM' });

    if (insights.length === 0) insights.push({ type: 'INFO', title: 'All Clear', description: 'No critical HR issues detected. Keep up the good work!', severity: 'LOW' });

    return { insights };
  }
}
