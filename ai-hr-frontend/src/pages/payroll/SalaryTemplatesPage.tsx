import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface SalaryTemplate {
  id: string;
  name: string;
  basicPct: number;
  hraPct: number;
  specialPct: number;
  pfApplicable: boolean;
  ptApplicable: boolean;
  _count?: { employees: number };
}

const mockTemplates: SalaryTemplate[] = [
  { id: '1', name: 'Standard - Engineering', basicPct: 50, hraPct: 20, specialPct: 30, pfApplicable: true, ptApplicable: true, _count: { employees: 45 } },
  { id: '2', name: 'Standard - Non-Tech', basicPct: 45, hraPct: 20, specialPct: 35, pfApplicable: true, ptApplicable: true, _count: { employees: 50 } },
  { id: '3', name: 'Senior Management', basicPct: 40, hraPct: 25, specialPct: 35, pfApplicable: true, ptApplicable: false, _count: { employees: 12 } },
  { id: '4', name: 'Contract/Intern', basicPct: 100, hraPct: 0, specialPct: 0, pfApplicable: false, ptApplicable: false, _count: { employees: 11 } },
];

const schema = z.object({
  name: z.string().min(2),
  basicPct: z.coerce.number().min(1).max(100),
  hraPct: z.coerce.number().min(0).max(100),
  specialPct: z.coerce.number().min(0).max(100),
});
type FormData = z.infer<typeof schema>;

export default function SalaryTemplatesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryTemplate | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery<SalaryTemplate[]>({
    queryKey: ['salary-templates'],
    queryFn: async () => {
      try { const r = await api.get('/payroll/templates'); return r.data.data ?? []; }
      catch { return mockTemplates; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: '', basicPct: 50, hraPct: 20, specialPct: 30 } });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/payroll/templates/${editing.id}`, data);
      else await api.post('/payroll/templates', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-templates'] }); toast({ title: editing ? 'Template updated' : 'Template created' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const openEdit = (t: SalaryTemplate) => {
    setEditing(t);
    form.reset({ name: t.name, basicPct: t.basicPct, hraPct: t.hraPct, specialPct: t.specialPct });
    setOpen(true);
  };

  const SalaryBar = ({ template }: { template: SalaryTemplate }) => (
    <div className="mt-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="bg-blue-500 transition-all" style={{ width: `${template.basicPct}%` }} title={`Basic ${template.basicPct}%`} />
        <div className="bg-green-500 transition-all" style={{ width: `${template.hraPct}%` }} title={`HRA ${template.hraPct}%`} />
        <div className="bg-orange-400 transition-all" style={{ width: `${template.specialPct}%` }} title={`Special ${template.specialPct}%`} />
      </div>
      <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
        <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1" />Basic {template.basicPct}%</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-green-500 mr-1" />HRA {template.hraPct}%</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-orange-400 mr-1" />Special {template.specialPct}%</span>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Salary Templates"
        description="Define reusable salary structures for different employee categories."
        actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Template</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id} className="relative group hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50"><FileText className="h-5 w-5 text-purple-600" /></div>
                  <div>
                    <h3 className="font-semibold text-sm">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t._count?.employees ?? 0} employees using this template</p>
                    <div className="mt-1.5 flex gap-1.5">
                      {t.pfApplicable && <Badge variant="secondary" className="text-xs">PF</Badge>}
                      {t.ptApplicable && <Badge variant="secondary" className="text-xs">PT</Badge>}
                    </div>
                  </div>
                </div>
              </div>
              <SalaryBar template={t} />
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Template' : 'Add Salary Template'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Template Name</FormLabel><FormControl><Input {...field} placeholder="Standard - Engineering" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="text-sm text-muted-foreground">Salary component percentages (of gross CTC)</div>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="basicPct" render={({ field }) => (
                  <FormItem><FormLabel>Basic %</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="hraPct" render={({ field }) => (
                  <FormItem><FormLabel>HRA %</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="specialPct" render={({ field }) => (
                  <FormItem><FormLabel>Special %</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              {(() => {
                const b = form.watch('basicPct') || 0;
                const h = form.watch('hraPct') || 0;
                const s = form.watch('specialPct') || 0;
                const total = b + h + s;
                return (
                  <div className={`text-sm p-2 rounded ${total === 100 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    Total: {total}% {total !== 100 ? '(must equal 100%)' : '✓'}
                  </div>
                );
              })()}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending || (form.watch('basicPct') + form.watch('hraPct') + form.watch('specialPct')) !== 100}>
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
