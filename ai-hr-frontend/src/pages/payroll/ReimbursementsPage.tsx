import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, CheckCircle, XCircle, Clock, Loader2, Upload } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface Reimbursement {
  id: string;
  employeeName: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  submittedOn: string;
}

const categories = ['Travel', 'Food & Entertainment', 'Medical', 'Training & Development', 'Office Supplies', 'Internet & Phone', 'Other'];

const mockReimbursements: Reimbursement[] = [
  { id: '1', employeeName: 'Priya Sharma', category: 'Travel', amount: 4500, description: 'Cab fare to client site (return trip)', date: '2026-02-20', status: 'PENDING', submittedOn: '2026-02-22' },
  { id: '2', employeeName: 'Rahul Mehta', category: 'Training & Development', amount: 12000, description: 'AWS certification course fee', date: '2026-02-15', status: 'APPROVED', submittedOn: '2026-02-16' },
  { id: '3', employeeName: 'Karan Singh', category: 'Food & Entertainment', amount: 3200, description: 'Client lunch at Taj', date: '2026-02-18', status: 'PENDING', submittedOn: '2026-02-19' },
  { id: '4', employeeName: 'Neha Gupta', category: 'Medical', amount: 1800, description: 'Doctor consultation and medicines', date: '2026-02-12', status: 'PAID', submittedOn: '2026-02-13' },
  { id: '5', employeeName: 'Amit Kumar', category: 'Internet & Phone', amount: 999, description: 'Home internet for WFH month', date: '2026-02-01', status: 'REJECTED', submittedOn: '2026-02-02' },
];

const schema = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1),
  description: z.string().min(5),
});
type FormData = z.infer<typeof schema>;

const statusConfig = {
  PENDING: { variant: 'warning' as const, icon: Clock },
  APPROVED: { variant: 'success' as const, icon: CheckCircle },
  REJECTED: { variant: 'destructive' as const, icon: XCircle },
  PAID: { variant: 'success' as const, icon: CheckCircle },
};

export default function ReimbursementsPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery<Reimbursement[]>({
    queryKey: ['reimbursements'],
    queryFn: async () => {
      try { const r = await api.get('/payroll/reimbursements'); return r.data.data?.data ?? []; }
      catch { return mockReimbursements; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { category: '', amount: 0, date: '', description: '' } });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/payroll/reimbursements', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reimbursements'] }); toast({ title: 'Reimbursement submitted!' }); setOpen(false); form.reset(); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/payroll/reimbursements/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reimbursements'] }),
  });

  const pending = items.filter(i => i.status === 'PENDING');
  const others = items.filter(i => i.status !== 'PENDING');

  const ItemCard = ({ item }: { item: Reimbursement }) => {
    const cfg = statusConfig[item.status];
    const Icon = cfg.icon;
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(item.employeeName)}</AvatarFallback></Avatar>
              <div>
                <p className="text-sm font-medium">{item.employeeName}</p>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">₹{item.amount.toLocaleString('en-IN')}</span>
              <Badge variant={cfg.variant} className="text-xs"><Icon className="h-3 w-3 mr-0.5" />{item.status}</Badge>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">Date: {formatDate(item.date)} · Submitted: {formatDate(item.submittedOn)}</p>
          {item.status === 'PENDING' && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ id: item.id, status: 'APPROVED' })}>
                <CheckCircle className="h-3 w-3 mr-1" />Approve
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => approveMutation.mutate({ id: item.id, status: 'REJECTED' })}>
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
        title="Reimbursements"
        description="Manage employee expense reimbursement requests."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Claim</Button>}
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-2 h-5 text-xs">{pending.length}</Badge></TabsTrigger>
          <TabsTrigger value="all">All Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {pending.length === 0 ? <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No pending claims.</p> : pending.map(i => <ItemCard key={i.id} item={i} />)}
          </div>
        </TabsContent>
        <TabsContent value="all">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {items.map(i => <ItemCard key={i.id} item={i} />)}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Reimbursement Claim</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Expense Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors">
                <Upload className="h-6 w-6 mx-auto mb-1 opacity-60" />Upload Receipt (optional)
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Claim
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
