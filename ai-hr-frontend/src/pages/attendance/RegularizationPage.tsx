import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface RegularizationRequest {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

const mockRequests: RegularizationRequest[] = [
  { id: '1', employeeName: 'Priya Sharma', date: '2026-02-20', checkIn: '10:30', checkOut: '19:30', reason: 'Forgot to punch in, was at client meeting', status: 'PENDING', submittedAt: '2026-02-21' },
  { id: '2', employeeName: 'Amit Kumar', date: '2026-02-18', checkIn: '09:00', checkOut: '18:00', reason: 'Device issue, biometric not working', status: 'APPROVED', submittedAt: '2026-02-19' },
  { id: '3', employeeName: 'Karan Singh', date: '2026-02-15', checkIn: '08:45', checkOut: '17:45', reason: 'Visited head office', status: 'REJECTED', submittedAt: '2026-02-16' },
  { id: '4', employeeName: 'Neha Gupta', date: '2026-02-22', checkIn: '09:00', checkOut: '14:00', reason: 'Medical appointment, half day', status: 'PENDING', submittedAt: '2026-02-22' },
];

const schema = z.object({
  date: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  reason: z.string().min(10, 'Please provide a detailed reason'),
});
type FormData = z.infer<typeof schema>;

const statusConfig = {
  PENDING: { variant: 'warning' as const, label: 'Pending', icon: Clock },
  APPROVED: { variant: 'success' as const, label: 'Approved', icon: CheckCircle },
  REJECTED: { variant: 'destructive' as const, label: 'Rejected', icon: XCircle },
};

export default function RegularizationPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery<RegularizationRequest[]>({
    queryKey: ['regularization'],
    queryFn: async () => {
      try { const r = await api.get('/attendance/regularization'); return r.data.data ?? []; }
      catch { return mockRequests; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { date: '', checkIn: '', checkOut: '', reason: '' } });

  const submitMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/attendance/regularization', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['regularization'] }); toast({ title: 'Regularization request submitted' }); setOpen(false); form.reset(); },
    onError: () => toast({ title: 'Error submitting request', variant: 'destructive' }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVE' | 'REJECT' }) =>
      api.patch(`/attendance/regularization/${id}`, { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regularization'] }),
  });

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  const RequestCard = ({ req }: { req: RegularizationRequest }) => {
    const cfg = statusConfig[req.status];
    const Icon = cfg.icon;
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(req.employeeName)}</AvatarFallback></Avatar>
              <div>
                <p className="text-sm font-medium">{req.employeeName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(req.date)}</p>
              </div>
            </div>
            <Badge variant={cfg.variant} className="text-xs"><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-muted-foreground">In: <span className="font-medium text-foreground font-mono">{req.checkIn}</span></span>
            <span className="text-muted-foreground">Out: <span className="font-medium text-foreground font-mono">{req.checkOut}</span></span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{req.reason}</p>
          {req.status === 'PENDING' && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ id: req.id, action: 'APPROVE' })}>
                <CheckCircle className="h-3 w-3 mr-1" />Approve
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => approveMutation.mutate({ id: req.id, action: 'REJECT' })}>
                <XCircle className="h-3 w-3 mr-1" />Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Attendance Regularization"
        description="Submit and manage attendance correction requests."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Request</Button>}
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-2 h-5 text-xs">{pending.length}</Badge></TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No pending requests.</p>
            ) : pending.map(r => <RequestCard key={r.id} req={r} />)}
          </div>
        </TabsContent>
        <TabsContent value="processed">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {processed.map(r => <RequestCard key={r.id} req={r} />)}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Regularization Request</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="checkIn" render={({ field }) => (
                  <FormItem><FormLabel>Actual Check-In</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="checkOut" render={({ field }) => (
                  <FormItem><FormLabel>Actual Check-Out</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem><FormLabel>Reason</FormLabel><FormControl><Textarea rows={3} placeholder="Please explain why attendance needs to be regularized..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitMutation.isPending}>
                  {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
