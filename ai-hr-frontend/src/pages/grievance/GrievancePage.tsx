import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface Grievance {
  id: string;
  ticketNo: string;
  subject: string;
  category: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  isAnonymous: boolean;
  employeeName?: string;
  submittedOn: string;
  resolvedOn?: string;
  resolution?: string;
}

const categories = ['Workplace Harassment', 'Pay Discrepancy', 'Working Conditions', 'Discrimination', 'Management Conduct', 'Policy Violation', 'POSH', 'Other'];

const mockGrievances: Grievance[] = [
  { id: '1', ticketNo: 'GRV-001', subject: 'Overtime compensation not received', category: 'Pay Discrepancy', description: 'I have been working overtime for the last 3 months but not received any overtime compensation as per company policy.', priority: 'HIGH', status: 'IN_PROGRESS', isAnonymous: false, employeeName: 'Priya Sharma', submittedOn: '2026-02-10' },
  { id: '2', ticketNo: 'GRV-002', subject: 'Uncomfortable work environment', category: 'Working Conditions', description: 'The office AC is not working properly causing discomfort.', priority: 'MEDIUM', status: 'RESOLVED', isAnonymous: false, employeeName: 'Amit Kumar', submittedOn: '2026-02-05', resolvedOn: '2026-02-15', resolution: 'AC serviced and repaired.' },
  { id: '3', ticketNo: 'GRV-003', subject: 'Inappropriate behavior by colleague', category: 'Workplace Harassment', description: 'A colleague has been making inappropriate comments during team meetings.', priority: 'CRITICAL', status: 'OPEN', isAnonymous: true, submittedOn: '2026-02-18' },
  { id: '4', ticketNo: 'GRV-004', subject: 'Travel allowance policy clarification needed', category: 'Policy Violation', description: 'Travel expense reimbursement policy seems inconsistently applied.', priority: 'LOW', status: 'CLOSED', isAnonymous: false, employeeName: 'Karan Singh', submittedOn: '2026-01-20', resolvedOn: '2026-01-30', resolution: 'Policy document shared and clarified.' },
];

const priorityVariant: Record<string, 'destructive' | 'warning' | 'secondary' | 'default'> = {
  CRITICAL: 'destructive', HIGH: 'warning', MEDIUM: 'secondary', LOW: 'default',
};
const statusConfig = {
  OPEN: { variant: 'warning' as const, icon: AlertCircle },
  IN_PROGRESS: { variant: 'info' as const, icon: Clock },
  RESOLVED: { variant: 'success' as const, icon: CheckCircle },
  CLOSED: { variant: 'secondary' as const, icon: CheckCircle },
};

const schema = z.object({
  subject: z.string().min(5),
  category: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(20),
  isAnonymous: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function GrievancePage() {
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: grievances = [] } = useQuery<Grievance[]>({
    queryKey: ['grievances'],
    queryFn: async () => {
      try { const r = await api.get('/grievance'); return r.data.data?.data ?? []; }
      catch { return mockGrievances; }
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', category: '', priority: 'MEDIUM', description: '', isAnonymous: false },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/grievance', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grievances'] }); toast({ title: 'Grievance submitted', description: 'Your grievance has been recorded and will be reviewed.' }); setOpen(false); form.reset(); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const open_ = grievances.filter(g => g.status === 'OPEN');
  const active = grievances.filter(g => g.status === 'IN_PROGRESS');
  const resolved = grievances.filter(g => ['RESOLVED', 'CLOSED'].includes(g.status));

  const viewGrievance = grievances.find(g => g.id === viewId);

  const GrievanceCard = ({ g }: { g: Grievance }) => {
    const scfg = statusConfig[g.status];
    const SIcon = scfg.icon;
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewId(g.id)}>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-xs text-muted-foreground font-mono">{g.ticketNo}</span>
              <h3 className="font-semibold text-sm mt-0.5">{g.subject}</h3>
            </div>
            <div className="flex gap-1 shrink-0">
              <Badge variant={priorityVariant[g.priority]} className="text-xs">{g.priority}</Badge>
              <Badge variant={scfg.variant} className="text-xs"><SIcon className="h-3 w-3 mr-0.5" />{g.status.replace('_', ' ')}</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{g.category}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!g.isAnonymous && g.employeeName ? (
                <><Avatar className="h-5 w-5"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(g.employeeName)}</AvatarFallback></Avatar>
                <span className="text-xs text-muted-foreground">{g.employeeName}</span></>
              ) : <Badge variant="secondary" className="text-xs"><Shield className="h-3 w-3 mr-1" />Anonymous</Badge>}
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(g.submittedOn)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Grievance Management"
        description="Confidential and fair grievance resolution system."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Raise Grievance</Button>}
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Open', count: open_.length, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'In Progress', count: active.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Resolved', count: resolved.length, color: 'text-green-600 bg-green-50' },
          { label: 'Critical', count: grievances.filter(g => g.priority === 'CRITICAL').length, color: 'text-red-600 bg-red-50' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color.split(' ')[1]}`}>
            <div className={`text-2xl font-bold ${color.split(' ')[0]}`}>{count}</div>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open <Badge variant="secondary" className="ml-2 h-5 text-xs">{open_.length}</Badge></TabsTrigger>
          <TabsTrigger value="active">In Progress <Badge variant="secondary" className="ml-2 h-5 text-xs">{active.length}</Badge></TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value="open"><div className="grid gap-4 sm:grid-cols-2 mt-4">{open_.map(g => <GrievanceCard key={g.id} g={g} />)}</div></TabsContent>
        <TabsContent value="active"><div className="grid gap-4 sm:grid-cols-2 mt-4">{active.map(g => <GrievanceCard key={g.id} g={g} />)}</div></TabsContent>
        <TabsContent value="resolved"><div className="grid gap-4 sm:grid-cols-2 mt-4">{resolved.map(g => <GrievanceCard key={g.id} g={g} />)}</div></TabsContent>
      </Tabs>

      {/* Submit Grievance */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Raise a Grievance</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} placeholder="Describe the issue in detail..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="isAnonymous" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div><FormLabel className="!mt-0">Submit Anonymously</FormLabel><p className="text-xs text-muted-foreground">Your identity will not be disclosed.</p></div>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Grievance
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Grievance Dialog */}
      <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewGrievance?.ticketNo} — {viewGrievance?.subject}</DialogTitle></DialogHeader>
          {viewGrievance && (
            <div className="space-y-3">
              <div className="flex gap-2"><Badge variant={priorityVariant[viewGrievance.priority]}>{viewGrievance.priority}</Badge><Badge variant={statusConfig[viewGrievance.status].variant}>{viewGrievance.status}</Badge></div>
              <p className="text-xs text-muted-foreground">Category: {viewGrievance.category}</p>
              <p className="text-sm">{viewGrievance.description}</p>
              {viewGrievance.resolution && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs font-medium text-green-700 mb-1">Resolution</p>
                  <p className="text-sm text-green-800">{viewGrievance.resolution}</p>
                  {viewGrievance.resolvedOn && <p className="text-xs text-green-600 mt-1">Resolved on {formatDate(viewGrievance.resolvedOn)}</p>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
