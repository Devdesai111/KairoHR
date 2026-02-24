import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCircle2, Clock, XCircle, Download, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeeCount: number;
  runDate?: string;
  runBy?: string;
}

const mockRuns: PayrollRun[] = [
  { id: '1', month: 'January', year: 2026, status: 'COMPLETED', totalGross: 24850000, totalNet: 19880000, totalDeductions: 4970000, employeeCount: 115, runDate: '2026-01-31', runBy: 'Sneha Joshi' },
  { id: '2', month: 'December', year: 2025, status: 'COMPLETED', totalGross: 24200000, totalNet: 19360000, totalDeductions: 4840000, employeeCount: 112, runDate: '2025-12-31', runBy: 'Sneha Joshi' },
  { id: '3', month: 'November', year: 2025, status: 'COMPLETED', totalGross: 23900000, totalNet: 19120000, totalDeductions: 4780000, employeeCount: 110, runDate: '2025-11-30', runBy: 'Sneha Joshi' },
];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const years = [2025, 2026];

const schema = z.object({ month: z.string().min(1), year: z.coerce.number() });
type FormData = z.infer<typeof schema>;

const statusConfig = {
  COMPLETED: { variant: 'success' as const, icon: CheckCircle2, label: 'Completed' },
  PROCESSING: { variant: 'warning' as const, icon: Clock, label: 'Processing' },
  PENDING: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
  FAILED: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' },
};

export default function RunPayrollPage() {
  const [runDialog, setRunDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: runs = [] } = useQuery<PayrollRun[]>({
    queryKey: ['payroll-runs'],
    queryFn: async () => {
      try { const r = await api.get('/payroll/runs'); return r.data.data?.data ?? []; }
      catch { return mockRuns; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { month: 'February', year: 2026 } });

  const runMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/payroll/runs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast({ title: 'Payroll run initiated!', description: 'Processing will complete shortly.' });
      setRunDialog(false);
      setConfirmDialog(false);
      form.reset();
    },
    onError: () => toast({ title: 'Error initiating payroll run', variant: 'destructive' }),
  });

  const handleRunSubmit = (data: FormData) => {
    setPendingData(data);
    setRunDialog(false);
    setConfirmDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Payroll Runs"
        description="Initiate and track monthly payroll processing."
        actions={<Button onClick={() => setRunDialog(true)}><Play className="h-4 w-4 mr-2" />Run Payroll</Button>}
      />

      {/* Run History */}
      <div className="space-y-4">
        {runs.map((run) => {
          const cfg = statusConfig[run.status];
          const Icon = cfg.icon;
          return (
            <Card key={run.id}>
              <CardContent className="pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">{run.month} {run.year}</h3>
                      <Badge variant={cfg.variant}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm flex-wrap">
                      <span className="text-muted-foreground">Employees: <span className="font-medium text-foreground">{run.employeeCount}</span></span>
                      <span className="text-muted-foreground">Gross: <span className="font-semibold text-foreground">₹{(run.totalGross / 100000).toFixed(2)}L</span></span>
                      <span className="text-muted-foreground">Net: <span className="font-semibold text-green-600">₹{(run.totalNet / 100000).toFixed(2)}L</span></span>
                      <span className="text-muted-foreground">Deductions: <span className="font-medium text-destructive">₹{(run.totalDeductions / 100000).toFixed(2)}L</span></span>
                    </div>
                    {run.runDate && (
                      <p className="text-xs text-muted-foreground mt-1">Processed on {formatDate(run.runDate)} by {run.runBy}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1.5" />View</Button>
                    <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Run Payroll Dialog */}
      <Dialog open={runDialog} onOpenChange={setRunDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Run Payroll</DialogTitle></DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Ensure all attendance, leave and reimbursement data is finalized before running payroll.</AlertDescription>
          </Alert>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRunSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="month" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRunDialog(false)}>Cancel</Button>
                <Button type="submit">Continue</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Payroll Run</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">You are about to initiate payroll processing for:</p>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm"><span>Period</span><span className="font-bold">{pendingData?.month} {pendingData?.year}</span></div>
              <div className="flex justify-between text-sm"><span>Employees</span><span className="font-medium">~118 employees</span></div>
              <div className="flex justify-between text-sm"><span>Estimated Gross</span><span className="font-medium">~₹25L</span></div>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>This action will generate payslips and mark the payroll as processed. This cannot be easily undone.</AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancel</Button>
            <Button
              disabled={runMutation.isPending}
              onClick={() => pendingData && runMutation.mutate(pendingData)}
            >
              {runMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><Play className="h-4 w-4 mr-2" />Confirm & Run</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
