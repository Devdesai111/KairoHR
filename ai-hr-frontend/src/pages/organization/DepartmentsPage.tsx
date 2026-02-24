import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users2, Pencil, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  head?: { name: string };
  parentId?: string;
  parent?: { name: string };
  _count?: { employees: number; children: number };
}

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  parentId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const mockDepts: Department[] = [
  { id: '1', name: 'Engineering', code: 'ENG', _count: { employees: 45, children: 3 } },
  { id: '2', name: 'Human Resources', code: 'HR', _count: { employees: 8, children: 0 } },
  { id: '3', name: 'Finance', code: 'FIN', _count: { employees: 12, children: 2 } },
  { id: '4', name: 'Marketing', code: 'MKT', _count: { employees: 15, children: 1 } },
  { id: '5', name: 'Sales', code: 'SAL', _count: { employees: 22, children: 2 } },
  { id: '6', name: 'Operations', code: 'OPS', _count: { employees: 18, children: 0 } },
  { id: '7', name: 'Product', code: 'PRD', _count: { employees: 10, children: 0 }, parentId: '1', parent: { name: 'Engineering' } },
  { id: '8', name: 'Design', code: 'DES', _count: { employees: 6, children: 0 }, parentId: '1', parent: { name: 'Engineering' } },
];

const COLORS = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-green-50 text-green-600', 'bg-orange-50 text-orange-600', 'bg-red-50 text-red-600', 'bg-teal-50 text-teal-600'];

export default function DepartmentsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: depts = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      try { const res = await api.get('/organization/departments'); return res.data.data ?? []; }
      catch { return mockDepts; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/organization/departments/${editing.id}`, data);
      else await api.post('/organization/departments', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast({ title: editing ? 'Department updated' : 'Department created' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organization/departments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });

  const rootDepts = depts.filter(d => !d.parentId);
  const subDepts = depts.filter(d => d.parentId);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Departments"
        description="Manage organizational departments and reporting hierarchies."
        actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Department</Button>}
      />

      <div className="space-y-6">
        {/* Root departments */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Level Departments</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rootDepts.map((dept, idx) => {
              const colorClass = COLORS[idx % COLORS.length];
              const children = subDepts.filter(s => s.parentId === dept.id);
              return (
                <Card key={dept.id} className="group hover:shadow-md transition-shadow relative">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorClass.split(' ')[0]}`}>
                        <Users2 className={`h-5 w-5 ${colorClass.split(' ')[1]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{dept.name}</span>
                          <span className="text-xs text-muted-foreground">· {dept.code}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{dept._count?.employees ?? 0} employees</p>
                        {children.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {children.map(c => (
                              <div key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <ChevronRight className="h-3 w-3" />{c.name} ({c._count?.employees ?? 0})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditing(dept); form.reset({ name: dept.name, code: dept.code }); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteMutation.mutate(dept.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Department' : 'Add Department'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Department Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} placeholder="ENG" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="parentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Department (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {rootDepts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
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
