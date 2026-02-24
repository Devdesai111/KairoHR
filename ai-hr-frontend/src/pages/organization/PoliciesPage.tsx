import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Download, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface Policy {
  id: string;
  title: string;
  category: string;
  description: string;
  version: string;
  effectiveDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

const categories = ['Leave Policy', 'Code of Conduct', 'POSH', 'Data Privacy', 'Work From Home', 'Travel & Expense', 'IT Security', 'Anti-Harassment'];

const mockPolicies: Policy[] = [
  { id: '1', title: 'Leave Policy 2026', category: 'Leave Policy', description: 'Annual leave entitlements, carry-forward rules and application procedures.', version: '2.1', effectiveDate: '2026-01-01', status: 'ACTIVE' },
  { id: '2', title: 'Code of Conduct', category: 'Code of Conduct', description: 'Expected behavior standards for all employees.', version: '1.5', effectiveDate: '2025-04-01', status: 'ACTIVE' },
  { id: '3', title: 'POSH Policy', category: 'POSH', description: 'Prevention of Sexual Harassment at workplace.', version: '1.2', effectiveDate: '2025-01-01', status: 'ACTIVE' },
  { id: '4', title: 'Work From Home Policy', category: 'Work From Home', description: 'Guidelines for remote work arrangements and eligibility.', version: '3.0', effectiveDate: '2025-09-01', status: 'ACTIVE' },
  { id: '5', title: 'IT Security Policy', category: 'IT Security', description: 'Information security guidelines and acceptable use.', version: '2.0', effectiveDate: '2025-06-01', status: 'DRAFT' },
];

const schema = z.object({
  title: z.string().min(2),
  category: z.string().min(1),
  description: z.string().min(10),
  version: z.string().min(1),
  effectiveDate: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const statusVariant: Record<string, 'success' | 'secondary' | 'warning'> = {
  ACTIVE: 'success', DRAFT: 'warning', ARCHIVED: 'secondary',
};

export default function PoliciesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ['policies'],
    queryFn: async () => {
      try { const res = await api.get('/organization/policies'); return res.data.data ?? []; }
      catch { return mockPolicies; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/organization/policies/${editing.id}`, data);
      else await api.post('/organization/policies', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['policies'] }); toast({ title: editing ? 'Policy updated' : 'Policy created' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organization/policies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="HR Policies"
        description="Manage company policies, handbooks and compliance documents."
        actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Policy</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <Card key={policy.id} className="relative group hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50"><FileText className="h-5 w-5 text-orange-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{policy.title}</h3>
                    <Badge variant={statusVariant[policy.status]}>{policy.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{policy.category} · v{policy.version}</p>
                  <p className="text-xs text-muted-foreground">{policy.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Effective: {new Date(policy.effectiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(policy); form.reset({ title: policy.title, category: policy.category, description: policy.description, version: policy.version, effectiveDate: policy.effectiveDate }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(policy.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Policy' : 'Add Policy'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="version" render={({ field }) => (
                  <FormItem><FormLabel>Version</FormLabel><FormControl><Input {...field} placeholder="1.0" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="effectiveDate" render={({ field }) => (
                <FormItem><FormLabel>Effective Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
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
