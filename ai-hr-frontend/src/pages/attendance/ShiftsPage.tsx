import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workHours: number;
  isFlexible: boolean;
  isDefault: boolean;
  _count?: { employees: number };
}

const mockShifts: Shift[] = [
  { id: '1', name: 'General Shift', code: 'GEN', startTime: '09:00', endTime: '18:00', workHours: 9, isFlexible: false, isDefault: true, _count: { employees: 85 } },
  { id: '2', name: 'Morning Shift', code: 'MOR', startTime: '07:00', endTime: '15:00', workHours: 8, isFlexible: false, isDefault: false, _count: { employees: 15 } },
  { id: '3', name: 'Night Shift', code: 'NGT', startTime: '21:00', endTime: '06:00', workHours: 9, isFlexible: false, isDefault: false, _count: { employees: 8 } },
  { id: '4', name: 'Flexible', code: 'FLX', startTime: '08:00', endTime: '20:00', workHours: 8, isFlexible: true, isDefault: false, _count: { employees: 16 } },
];

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  workHours: z.coerce.number().min(1).max(24),
  isFlexible: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function ShiftsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ['shifts'],
    queryFn: async () => {
      try { const r = await api.get('/attendance/shifts'); return r.data.data ?? []; }
      catch { return mockShifts; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: '', code: '', startTime: '09:00', endTime: '18:00', workHours: 9, isFlexible: false } });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/attendance/shifts/${editing.id}`, data);
      else await api.post('/attendance/shifts', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast({ title: editing ? 'Shift updated' : 'Shift created' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/attendance/shifts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });

  const openEdit = (s: Shift) => {
    setEditing(s);
    form.reset({ name: s.name, code: s.code, startTime: s.startTime, endTime: s.endTime, workHours: s.workHours, isFlexible: s.isFlexible });
    setOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Work Shifts"
        description="Define and manage work shift schedules."
        actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Shift</Button>}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => (
            <Card key={shift.id} className="relative group hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50"><Clock className="h-5 w-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{shift.name}</h3>
                      <Badge variant="outline" className="text-xs">{shift.code}</Badge>
                      {shift.isDefault && <Badge className="text-xs">Default</Badge>}
                      {shift.isFlexible && <Badge variant="secondary" className="text-xs">Flexible</Badge>}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="font-mono text-primary">{shift.startTime}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="font-mono text-primary">{shift.endTime}</span>
                      <span className="text-xs text-muted-foreground">({shift.workHours}h)</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />{shift._count?.employees ?? 0} employees assigned
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(shift)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(shift.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Shift' : 'Add Shift'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Shift Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} placeholder="GEN" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="workHours" render={({ field }) => (
                  <FormItem><FormLabel>Work Hours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="isFlexible" render={({ field }) => (
                  <FormItem className="col-span-2 flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Flexible Shift</FormLabel>
                  </FormItem>
                )} />
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
