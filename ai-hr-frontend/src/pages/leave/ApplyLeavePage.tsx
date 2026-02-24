import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CalendarDays } from 'lucide-react';
import { differenceInBusinessDays, parseISO, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

const schema = z.object({
  leaveTypeId: z.string().min(1, 'Select leave type'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
}).refine(d => new Date(d.endDate) >= new Date(d.startDate), {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

type FormData = z.infer<typeof schema>;

interface LeaveType {
  id: string;
  name: string;
  available: number;
  color: string;
}

const mockLeaveTypes: LeaveType[] = [
  { id: '1', name: 'Annual Leave', available: 14, color: '#3b82f6' },
  { id: '2', name: 'Sick Leave', available: 10, color: '#ef4444' },
  { id: '3', name: 'Casual Leave', available: 7, color: '#10b981' },
  { id: '5', name: 'Comp Off', available: 3, color: '#f59e0b' },
];

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: leaveTypes = mockLeaveTypes } = useQuery<LeaveType[]>({
    queryKey: ['leave-types-apply'],
    queryFn: async () => {
      try { const r = await api.get('/leave/types'); return r.data.data ?? mockLeaveTypes; }
      catch { return mockLeaveTypes; }
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { leaveTypeId: '', startDate: '', endDate: '', reason: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/leave/applications', data),
    onSuccess: () => {
      toast({ title: 'Leave application submitted!', description: 'Your manager will review it shortly.' });
      navigate('/leave');
    },
    onError: () => toast({ title: 'Error submitting application', variant: 'destructive' }),
  });

  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');
  const leaveTypeId = form.watch('leaveTypeId');

  const workingDays = startDate && endDate && new Date(endDate) >= new Date(startDate)
    ? differenceInBusinessDays(parseISO(endDate), parseISO(startDate)) + 1
    : 0;

  const selectedType = leaveTypes.find(lt => lt.id === leaveTypeId);
  const isInsufficient = selectedType && workingDays > selectedType.available;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl font-bold">Apply for Leave</h1>
          <p className="text-sm text-muted-foreground">Submit a new leave request</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Leave Details</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="leaveTypeId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select leave type..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leaveTypes.map(lt => (
                            <SelectItem key={lt.id} value={lt.id}>
                              <span>{lt.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">({lt.available} days available)</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem><FormLabel>Start Date *</FormLabel><FormControl><Input type="date" min={format(new Date(), 'yyyy-MM-dd')} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem><FormLabel>End Date *</FormLabel><FormControl><Input type="date" min={startDate || format(new Date(), 'yyyy-MM-dd')} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason *</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Please provide the reason for your leave request..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {isInsufficient && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                      Insufficient leave balance. You have {selectedType.available} days available but requested {workingDays} days.
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button type="submit" disabled={mutation.isPending || isInsufficient}>
                      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-4">
                <CalendarDays className="h-10 w-10 mx-auto text-primary mb-2" />
                <div className="text-4xl font-bold text-primary">{workingDays || '—'}</div>
                <p className="text-sm text-muted-foreground">working days</p>
              </div>
              {selectedType && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Leave type</span>
                    <span className="font-medium">{selectedType.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <Badge variant={isInsufficient ? 'destructive' : 'success'}>{selectedType.available} days</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After approval</span>
                    <span className="font-medium">{Math.max(0, selectedType.available - workingDays)} days</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Leave Balance Quick View */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground">Your Balances</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaveTypes.map(lt => (
                <div key={lt.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{lt.name}</span>
                  <span className="font-medium" style={{ color: lt.color }}>{lt.available}d</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
