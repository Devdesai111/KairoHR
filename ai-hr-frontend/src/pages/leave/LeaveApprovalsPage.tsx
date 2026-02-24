import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface LeaveApplication {
  id: string;
  employee: { name: string; employeeId: string; department: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
  approverComment?: string;
}

const mockApplications: LeaveApplication[] = [
  { id: '1', employee: { name: 'Priya Sharma', employeeId: 'EMP001', department: 'Engineering' }, leaveType: 'Annual Leave', startDate: '2026-02-25', endDate: '2026-02-26', days: 2, reason: 'Personal work at home town', status: 'PENDING', appliedOn: '2026-02-22' },
  { id: '2', employee: { name: 'Neha Gupta', employeeId: 'EMP005', department: 'Finance' }, leaveType: 'Sick Leave', startDate: '2026-02-27', endDate: '2026-02-28', days: 2, reason: 'Doctor visit and rest', status: 'PENDING', appliedOn: '2026-02-23' },
  { id: '3', employee: { name: 'Karan Singh', employeeId: 'EMP004', department: 'Sales' }, leaveType: 'Casual Leave', startDate: '2026-03-01', endDate: '2026-03-01', days: 1, reason: 'School function for child', status: 'PENDING', appliedOn: '2026-02-22' },
  { id: '4', employee: { name: 'Amit Kumar', employeeId: 'EMP006', department: 'Engineering' }, leaveType: 'Annual Leave', startDate: '2026-02-15', endDate: '2026-02-17', days: 3, reason: 'Family vacation', status: 'APPROVED', appliedOn: '2026-02-10' },
  { id: '5', employee: { name: 'Anjali Patel', employeeId: 'EMP003', department: 'Design' }, leaveType: 'Sick Leave', startDate: '2026-02-12', endDate: '2026-02-13', days: 2, reason: 'Fever', status: 'REJECTED', appliedOn: '2026-02-11', approverComment: 'Critical project delivery period' },
];

const statusConfig = {
  PENDING: { variant: 'warning' as const, icon: Clock },
  APPROVED: { variant: 'success' as const, icon: CheckCircle },
  REJECTED: { variant: 'destructive' as const, icon: XCircle },
};

export default function LeaveApprovalsPage() {
  const [search, setSearch] = useState('');
  const [actionDialog, setActionDialog] = useState<{ app: LeaveApplication; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: applications = [] } = useQuery<LeaveApplication[]>({
    queryKey: ['leave-approvals'],
    queryFn: async () => {
      try { const r = await api.get('/leave/applications', { params: { status: 'all' } }); return r.data.data?.data ?? []; }
      catch { return mockApplications; }
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: string; comment: string }) =>
      api.patch(`/leave/applications/${id}/status`, { status, comment }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['leave-approvals'] });
      toast({ title: vars.status === 'APPROVED' ? 'Leave approved' : 'Leave rejected' });
      setActionDialog(null);
      setComment('');
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const filtered = applications.filter(a =>
    !search || a.employee.name.toLowerCase().includes(search.toLowerCase()) || a.employee.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter(a => a.status === 'PENDING');
  const processed = filtered.filter(a => a.status !== 'PENDING');

  const AppCard = ({ app }: { app: LeaveApplication }) => {
    const cfg = statusConfig[app.status];
    const Icon = cfg.icon;
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{getInitials(app.employee.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{app.employee.name}</p>
                  <p className="text-xs text-muted-foreground">{app.employee.department} · {app.employee.employeeId}</p>
                </div>
                <Badge variant={cfg.variant} className="text-xs shrink-0"><Icon className="h-3 w-3 mr-1" />{app.status}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <span className="font-medium text-primary">{app.leaveType}</span>
                <span className="text-muted-foreground">{formatDate(app.startDate)} — {formatDate(app.endDate)}</span>
                <Badge variant="outline" className="text-xs">{app.days} day{app.days !== 1 ? 's' : ''}</Badge>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{app.reason}</p>
              {app.approverComment && <p className="mt-1 text-xs text-destructive italic">"{app.approverComment}"</p>}
              <p className="mt-1.5 text-xs text-muted-foreground">Applied: {formatDate(app.appliedOn)}</p>
              {app.status === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => setActionDialog({ app, action: 'APPROVE' })}>
                    <CheckCircle className="h-3 w-3 mr-1" />Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setActionDialog({ app, action: 'REJECT' })}>
                    <XCircle className="h-3 w-3 mr-1" />Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Leave Approvals" description="Review and approve employee leave requests." />

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending <Badge variant="secondary" className="ml-2 h-5 text-xs">{pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {pending.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>All caught up! No pending approvals.</p>
              </div>
            ) : pending.map(a => <AppCard key={a.id} app={a} />)}
          </div>
        </TabsContent>
        <TabsContent value="processed">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {processed.map(a => <AppCard key={a.id} app={a} />)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setComment(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.action === 'APPROVE' ? 'Approve Leave' : 'Reject Leave'}</DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">{actionDialog.app.employee.name}</p>
                <p className="text-xs text-muted-foreground">{actionDialog.app.leaveType} · {actionDialog.app.days} days</p>
                <p className="text-xs text-muted-foreground">{formatDate(actionDialog.app.startDate)} — {formatDate(actionDialog.app.endDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Comment {actionDialog.action === 'REJECT' ? '(required)' : '(optional)'}</label>
                <Textarea rows={3} placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant={actionDialog?.action === 'APPROVE' ? 'default' : 'destructive'}
              disabled={actionMutation.isPending || (actionDialog?.action === 'REJECT' && !comment.trim())}
              onClick={() => actionDialog && actionMutation.mutate({ id: actionDialog.app.id, status: actionDialog.action === 'APPROVE' ? 'APPROVED' : 'REJECTED', comment })}
            >
              {actionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog?.action === 'APPROVE' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
