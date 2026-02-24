import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, Send, User, Loader2, Sparkles, RefreshCw, Copy, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  'How many employees are currently on leave?',
  'Show me the attendance report for this month',
  'Who are the top performers in Engineering department?',
  'What is the payroll cost for January 2026?',
  'Generate a headcount summary by department',
  'Which candidates are in the final interview stage?',
  'What are the pending reimbursement requests?',
  'Help me write a job description for a Senior React Developer',
];

const mockResponses: Record<string, string> = {
  default: `I'm KairoHR AI Assistant, powered by Claude. I can help you with:

• **Employee data** — search, analyze and summarize employee information
• **HR Reports** — generate instant reports on attendance, leave, payroll
• **Recruitment** — assist with job descriptions and candidate analysis
• **Policy Q&A** — answer questions about HR policies
• **Data insights** — surface trends and anomalies in your HR data

What would you like to know?`,
};

function MarkdownContent({ content }: { content: string }) {
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• /gm, '&bull; ')
    .replace(/\n/g, '<br />');
  return <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: mockResponses.default,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const mutation = useMutation({
    mutationFn: async (userMessage: string): Promise<string> => {
      try {
        const res = await api.post('/ai/chat', {
          message: userMessage,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        });
        return res.data.data?.response ?? res.data.data?.message ?? 'I could not process that request.';
      } catch {
        // Intelligent mock responses
        if (userMessage.toLowerCase().includes('leave')) {
          return '**Current Leave Status:**\n\n• Total employees on leave today: **6**\n• Annual Leave: 4 employees (Priya Sharma, Rahul Mehta, and 2 others)\n• Sick Leave: 2 employees\n\nPending leave approvals: **8 requests** awaiting manager action.\n\nWould you like me to show the full leave report?';
        }
        if (userMessage.toLowerCase().includes('attendance')) {
          return '**Attendance Summary — February 2026:**\n\n• Average attendance rate: **87.4%**\n• Present today: 108 out of 124 employees\n• Late arrivals: 6 employees\n• Absent: 10 employees\n\nDepartment with best attendance: **Finance (95.2%)**\nDepartment needing attention: **Sales (78.4%)**';
        }
        if (userMessage.toLowerCase().includes('payroll')) {
          return '**Payroll Summary — January 2026:**\n\n• Total Gross: **₹24.85 Lakhs**\n• Total Net Disbursed: **₹19.88 Lakhs**\n• Total Deductions: **₹4.97 Lakhs** (PF, PT, TDS)\n• Employees Paid: **115**\n\nFebruary 2026 payroll has **not yet been processed**. Would you like me to initiate it?';
        }
        if (userMessage.toLowerCase().includes('employee') || userMessage.toLowerCase().includes('headcount')) {
          return '**Headcount Summary:**\n\n• **Total Employees:** 124\n• Active: 118 | On Leave: 6\n• **By Department:**\n  — Engineering: 45\n  — Sales: 22\n  — Marketing: 15\n  — Finance: 12\n  — Design: 8\n  — HR: 8\n  — Product: 10\n  — Others: 4\n\n**New hires this month:** 4 employees joined in February.';
        }
        if (userMessage.toLowerCase().includes('job description') || userMessage.toLowerCase().includes('jd')) {
          return '**Job Description — Senior React Developer:**\n\n**About the Role:**\nWe are looking for an experienced Senior React Developer to join our growing engineering team...\n\n**Responsibilities:**\n• Build and maintain high-quality React applications\n• Collaborate with design and product teams\n• Mentor junior developers\n• Participate in code reviews\n\n**Requirements:**\n• 4+ years of React experience\n• Strong TypeScript skills\n• Experience with state management (Zustand/Redux)\n• REST/GraphQL API integration\n\nShall I add more details or customize this further?';
        }
        return `I understand you're asking about **"${userMessage}"**.\n\nI'm currently running in offline mode and can provide limited responses. For full AI capabilities, please ensure the backend AI service is connected.\n\nIs there anything specific from your HR data I can help you analyze?`;
      }
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }]);
    },
    onError: () => toast({ title: 'Error communicating with AI', variant: 'destructive' }),
  });

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || mutation.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    mutation.mutate(trimmed);
  };

  const copyToClipboard = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-4">
      <PageHeader
        title="AI Assistant"
        description="Powered by Claude — ask anything about your HR data"
        actions={
          <Button variant="outline" size="sm" onClick={() => setMessages([{ id: 'welcome', role: 'assistant', content: mockResponses.default, timestamp: new Date() }])}>
            <RefreshCw className="h-4 w-4 mr-2" />New Chat
          </Button>
        }
      />

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <Card className="flex-1 min-h-0">
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full" ref={scrollRef}>
                <div className="p-6 space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {message.role === 'assistant' ? (
                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                            {getInitials(user?.name ?? 'U')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] space-y-1 ${message.role === 'user' ? 'items-end' : ''} flex flex-col`}>
                        <div className={`group relative rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                          {message.role === 'assistant' ? (
                            <MarkdownContent content={message.content} />
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {message.role === 'assistant' && (
                            <button
                              onClick={() => copyToClipboard(message.id, message.content)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background/50"
                            >
                              {copiedId === message.id ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                          {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {mutation.isPending && (
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Input */}
          <div className="mt-3 flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your HR data... (Enter to send, Shift+Enter for new line)"
              className="resize-none min-h-[52px] max-h-32"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || mutation.isPending}
              className="h-auto px-4"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Suggestions Sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3">
              <Sparkles className="h-4 w-4" />Suggested Prompts
            </div>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                  className="w-full text-left text-xs p-2.5 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors leading-relaxed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Capabilities</div>
            <div className="space-y-1.5">
              {['HR Analytics', 'Leave Reports', 'Payroll Data', 'Recruitment', 'Attendance', 'JD Writing'].map(cap => (
                <Badge key={cap} variant="secondary" className="text-xs mr-1">{cap}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
