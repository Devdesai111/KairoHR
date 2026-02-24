import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, CalendarDays } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface LeaveType {
  id: string;
  name: string;
  code: string;
  daysAllowed: number;
  isPaid: boolean;
  isCarryForward: boolean;
  maxCarryForward: number;
  color: string;
  requiresApproval: boolean;
}

const mockLeaveTypes: LeaveType[] = [
  { id: '1', name: 'Annual Leave', code: 'AL', daysAllowed: 21, isPaid: true, isCarryForward: true, maxCarryForward: 5, color: '#3b82f6', requiresApproval: true },
  { id: '2', name: 'Sick Leave', code: 'SL', daysAllowed: 12, isPaid: true, isCarryForward: false, maxCarryForward: 0, color: '#ef4444', requiresApproval: false },
  { id: '3', name: 'Casual Leave', code: 'CL', daysAllowed: 10, isPaid: true, isCarryForward: false, maxCarryForward: 0, color: '#10b981', requiresApproval: true },
  { id: '4', name: 'Maternity Leave', code: 'ML', daysAllowed: 182, isPaid: true, isCarryForward: false, maxCarryForward: 0, color: '#8b5cf6', requiresApproval: true },
  { id: '5', name: 'Paternity Leave', code: 'PL', daysAllowed: 15, isPaid: true, isCarryForward: false, maxCarryForward: 0, color: '#6366f1', requiresApproval: true },
  { id: '6', name: 'Comp Off', code: 'CO', daysAllowed: 0, isPaid: true, isCarryForward: false, maxCarryForward: 0, color: '#f59e0b', requiresApproval: false },
  { id: '7', name: 'Loss of Pay', code: 'LOP', daysAllowed: 0, isPaid: false, isCarryForward: false, maxCarryForward: 0, color: '#6b7280', requiresApproval: true },
];

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(5),
  daysAllowed: z.coerce.number().min(0),
  isPaid: z.boolean(),
  isCarryForward: z.boolean(),
  maxCarryForward: z.coerce.number().min(0),
  color: z.string().min(1),
  requiresApproval: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function LeaveTypesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: types = [] } = useQuery<LeaveType[]>({
    queryKey: ['leave-types'],
    queryFn: async () => {
      try { const r = await api.get('/leave/types'); return r.data.data ?? []; }
      catch { return mockLeaveTypes; }
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', daysAllowed: 0, isPaid: true, isCarryForward: false, maxCarryForward: 0, color: '#3b82f6', requiresApproval: true },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/leave/types/${editing.id}`, data);
      else await api.post('/leave/types', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave-types'] }); toast({ title: editing ? 'Leave type updated' : 'Leave type created' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const openEdit = (lt: LeaveType) => {
    setEditing(lt);
    form.reset({ name: lt.name, code: lt.code, daysAllowed: lt.daysAllowed, isPaid: lt.isPaid, isCarryForward: lt.isCarryForward, maxCarryForward: lt.maxCarryForward, color: lt.color, requiresApproval: lt.requiresApproval });
    setOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Leave Types"
        description="Configure leave types and their entitlement rules."
        actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Leave Type</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((lt) => (
          <Card key={lt.id} className="relative group hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${lt.color}20` }}>
                  <CalendarDays className="h-5 w-5" style={{ color: lt.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{lt.name}</h3>
                    <Badge variant="outline" className="text-xs">{lt.code}</Badge>
                  </div>
                  <p className="text-sm font-bold mt-1" style={{ color: lt.color }}>
                    {lt.daysAllowed === 0 ? 'Unlimited / On-demand' : `${lt.daysAllowed} days/year`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={lt.isPaid ? 'success' : 'secondary'} className="text-xs">{lt.isPaid ? 'Paid' : 'Unpaid'}</Badge>
                    {lt.isCarryForward && <Badge variant="secondary" className="text-xs">CF up to {lt.maxCarryForward}</Badge>}
                    {lt.requiresApproval && <Badge variant="secondary" className="text-xs">Approval req.</Badge>}
                  </div>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(lt)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} placeholder="AL" className="uppercase" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="daysAllowed" render={({ field }) => (
                  <FormItem><FormLabel>Days / Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="color" render={({ field }) => (
                  <FormItem><FormLabel>Color</FormLabel><FormControl><Input type="color" {...field} className="h-10 px-2" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="maxCarryForward" render={({ field }) => (
                  <FormItem><FormLabel>Max Carry Forward</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <div className="space-y-3">
                {[
                  { name: 'isPaid' as const, label: 'Paid Leave' },
                  { name: 'isCarryForward' as const, label: 'Allow Carry Forward' },
                  { name: 'requiresApproval' as const, label: 'Requires Approval' },
                ].map(({ name, label }) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl><Switch checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                      <FormLabel className="!mt-0">{label}</FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
