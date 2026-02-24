import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Calendar, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface Application {
  id: string;
  candidateName: string;
  jobTitle: string;
  department: string;
  stage: string;
  appliedOn: string;
  lastUpdated: string;
  score?: number;
}

const stages = ['NEW', 'SCREENING', 'PHONE_SCREEN', 'TECHNICAL', 'HR_INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const stageLabels: Record<string, string> = {
  NEW: 'New', SCREENING: 'Screening', PHONE_SCREEN: 'Phone Screen', TECHNICAL: 'Technical', HR_INTERVIEW: 'HR Interview', OFFER: 'Offer', HIRED: 'Hired', REJECTED: 'Rejected',
};
const stageVariant: Record<string, 'secondary' | 'warning' | 'info' | 'default' | 'success' | 'destructive'> = {
  NEW: 'secondary', SCREENING: 'warning', PHONE_SCREEN: 'info', TECHNICAL: 'info', HR_INTERVIEW: 'warning', OFFER: 'default', HIRED: 'success', REJECTED: 'destructive',
};

const mockApps: Application[] = [
  { id: '1', candidateName: 'Arjun Kapoor', jobTitle: 'Senior Software Engineer', department: 'Engineering', stage: 'TECHNICAL', appliedOn: '2026-02-01', lastUpdated: '2026-02-18', score: 78 },
  { id: '2', candidateName: 'Shreya Mishra', jobTitle: 'Product Manager', department: 'Product', stage: 'PHONE_SCREEN', appliedOn: '2026-02-05', lastUpdated: '2026-02-15', score: 82 },
  { id: '3', candidateName: 'Vikash Yadav', jobTitle: 'Senior Software Engineer', department: 'Engineering', stage: 'NEW', appliedOn: '2026-02-12', lastUpdated: '2026-02-12' },
  { id: '4', candidateName: 'Kavya Reddy', jobTitle: 'UI/UX Designer', department: 'Design', stage: 'OFFER', appliedOn: '2026-01-28', lastUpdated: '2026-02-20', score: 92 },
  { id: '5', candidateName: 'Rohan Sharma', jobTitle: 'Senior Software Engineer', department: 'Engineering', stage: 'HIRED', appliedOn: '2026-01-20', lastUpdated: '2026-02-15', score: 95 },
];

export default function ApplicationsPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ['applications', stageFilter],
    queryFn: async () => {
      try { const r = await api.get('/recruitment/applications', { params: { stage: stageFilter !== 'ALL' ? stageFilter : undefined } }); return r.data.data?.data ?? []; }
      catch { return mockApps; }
    },
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.patch(`/recruitment/applications/${id}`, { stage }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast({ title: 'Stage updated' }); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const filtered = applications.filter(a =>
    !search || a.candidateName.toLowerCase().includes(search.toLowerCase()) || a.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Applications" description="Track all job applications in the pipeline." />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stages</SelectItem>
            {stages.map(s => <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban-style pipeline view */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {['NEW', 'SCREENING', 'TECHNICAL', 'OFFER', 'HIRED'].map((stage) => {
            const stageApps = filtered.filter(a => a.stage === stage);
            return (
              <div key={stage} className="w-64 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{stageLabels[stage]}</span>
                  <Badge variant="secondary" className="text-xs">{stageApps.length}</Badge>
                </div>
                <div className="space-y-3">
                  {stageApps.map(app => (
                    <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(app.candidateName)}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{app.candidateName}</p>
                            <p className="text-xs text-muted-foreground truncate">{app.jobTitle}</p>
                          </div>
                        </div>
                        {app.score && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Score</span><span className="font-medium">{app.score}%</span></div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${app.score}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3" />{formatDate(app.appliedOn)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full h-7 text-xs justify-between">
                              Move Stage <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {stages.filter(s => s !== app.stage).map(s => (
                              <DropdownMenuItem key={s} onClick={() => stageMutation.mutate({ id: app.id, stage: s })}>
                                Move to {stageLabels[s]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
                  {stageApps.length === 0 && (
                    <div className="h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
