import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface Loan {
  id: string;
  employeeName: string;
  employeeId: string;
  principalAmount: number;
  disbursedAmount: number;
  repaidAmount: number;
  emiAmount: number;
  tenure: number;
  remainingTenure: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'CLOSED' | 'REJECTED';
  appliedOn: string;
}

const mockLoans: Loan[] = [
  { id: '1', employeeName: 'Priya Sharma', employeeId: 'EMP001', principalAmount: 200000, disbursedAmount: 200000, repaidAmount: 60000, emiAmount: 20000, tenure: 10, remainingTenure: 7, purpose: 'Medical emergency', status: 'ACTIVE', appliedOn: '2025-06-01' },
  { id: '2', employeeName: 'Amit Kumar', employeeId: 'EMP006', principalAmount: 100000, disbursedAmount: 100000, repaidAmount: 20000, emiAmount: 10000, tenure: 10, remainingTenure: 8, purpose: 'Education fees', status: 'ACTIVE', appliedOn: '2025-10-01' },
  { id: '3', employeeName: 'Sneha Joshi', employeeId: 'EMP007', principalAmount: 50000, disbursedAmount: 0, repaidAmount: 0, emiAmount: 0, tenure: 5, remainingTenure: 5, purpose: 'Home appliances', status: 'PENDING', appliedOn: '2026-02-10' },
  { id: '4', employeeName: 'Karan Singh', employeeId: 'EMP004', principalAmount: 300000, disbursedAmount: 300000, repaidAmount: 300000, emiAmount: 25000, tenure: 12, remainingTenure: 0, purpose: 'Home renovation', status: 'CLOSED', appliedOn: '2024-08-01' },
];

const schema = z.object({
  principalAmount: z.coerce.number().min(1000),
  tenure: z.coerce.number().min(1).max(60),
  purpose: z.string().min(5),
});
type FormData = z.infer<typeof schema>;

const statusConfig = {
  PENDING: { variant: 'warning' as const, icon: Clock },
  APPROVED: { variant: 'success' as const, icon: CheckCircle },
  ACTIVE: { variant: 'info' as const, icon: TrendingUp },
  CLOSED: { variant: 'secondary' as const, icon: CheckCircle },
  REJECTED: { variant: 'destructive' as const, icon: XCircle },
};

export default function LoansPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: loans = [] } = useQuery<Loan[]>({
    queryKey: ['loans'],
    queryFn: async () => {
      try { const r = await api.get('/payroll/loans'); return r.data.data?.data ?? []; }
      catch { return mockLoans; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { principalAmount: 0, tenure: 6, purpose: '' } });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/payroll/loans', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loans'] }); toast({ title: 'Loan application submitted!' }); setOpen(false); form.reset(); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/payroll/loans/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });

  const totalActive = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + (l.principalAmount - l.repaidAmount), 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Loans & Advances"
        description="Manage employee salary advance and loan requests."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Apply for Loan</Button>}
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Loans', value: loans.filter(l => l.status === 'ACTIVE').length, suffix: 'loans' },
          { label: 'Outstanding Amount', value: `₹${(totalActive / 1000).toFixed(0)}K`, suffix: 'to be recovered' },
          { label: 'Pending Approvals', value: loans.filter(l => l.status === 'PENDING').length, suffix: 'applications' },
        ].map(({ label, value, suffix }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="text-2xl font-bold text-primary">{value}</div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{suffix}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loan Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loans.map((loan) => {
          const cfg = statusConfig[loan.status];
          const Icon = cfg.icon;
          const repaidPct = loan.principalAmount > 0 ? Math.round((loan.repaidAmount / loan.principalAmount) * 100) : 0;
          return (
            <Card key={loan.id} className="relative group">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(loan.employeeName)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{loan.employeeName}</p>
                      <Badge variant={cfg.variant} className="text-xs"><Icon className="h-3 w-3 mr-0.5" />{loan.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{loan.employeeId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
                  <span className="text-muted-foreground">Principal</span><span className="font-medium text-right">₹{loan.principalAmount.toLocaleString('en-IN')}</span>
                  <span className="text-muted-foreground">EMI</span><span className="font-medium text-right">{loan.emiAmount > 0 ? `₹${loan.emiAmount.toLocaleString('en-IN')}/mo` : '—'}</span>
                  <span className="text-muted-foreground">Tenure</span><span className="font-medium text-right">{loan.tenure} months</span>
                  <span className="text-muted-foreground">Remaining</span><span className="font-medium text-right">{loan.remainingTenure} months</span>
                </div>
                {loan.status === 'ACTIVE' && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Repaid</span>
                      <span className="font-medium">{repaidPct}%</span>
                    </div>
                    <Progress value={repaidPct} className="h-1.5" />
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{loan.purpose}</p>
                <p className="text-xs text-muted-foreground">Applied: {formatDate(loan.appliedOn)}</p>
                {loan.status === 'PENDING' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ id: loan.id, status: 'APPROVED' })}>
                      <CheckCircle className="h-3 w-3 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => approveMutation.mutate({ id: loan.id, status: 'REJECTED' })}>
                      <XCircle className="h-3 w-3 mr-1" />Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Salary Advance/Loan</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="principalAmount" render={({ field }) => (
                <FormItem><FormLabel>Loan Amount (₹)</FormLabel><FormControl><Input type="number" {...field} placeholder="100000" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tenure" render={({ field }) => (
                <FormItem><FormLabel>Repayment Tenure (months)</FormLabel><FormControl><Input type="number" min={1} max={60} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {form.watch('principalAmount') > 0 && form.watch('tenure') > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 text-sm">
                  <p className="text-muted-foreground">Estimated EMI: <span className="font-bold text-primary">₹{Math.ceil(form.watch('principalAmount') / form.watch('tenure')).toLocaleString('en-IN')}/month</span></p>
                </div>
              )}
              <FormField control={form.control} name="purpose" render={({ field }) => (
                <FormItem><FormLabel>Purpose</FormLabel><FormControl><Textarea rows={3} placeholder="Explain the reason for this loan..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Application
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
