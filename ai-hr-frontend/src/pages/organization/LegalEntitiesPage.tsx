import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Pencil, Trash2, Loader2 } from 'lucide-react';
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

interface LegalEntity {
  id: string;
  name: string;
  registrationNumber: string;
  taxId: string;
  country: string;
  state: string;
  isDefault: boolean;
  _count?: { employees: number };
}

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  taxId: z.string().min(1, 'Tax ID is required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
});
type FormData = z.infer<typeof schema>;

export default function LegalEntitiesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LegalEntity | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: entities = [], isLoading } = useQuery<LegalEntity[]>({
    queryKey: ['legal-entities'],
    queryFn: async () => {
      try {
        const res = await api.get('/organization/legal-entities');
        return res.data.data ?? [];
      } catch {
        return [
          { id: '1', name: 'TechCorp India Pvt Ltd', registrationNumber: 'U72200MH2015PTC123456', taxId: '27AAACT1234A1ZS', country: 'India', state: 'Maharashtra', isDefault: true, _count: { employees: 98 } },
          { id: '2', name: 'TechCorp US LLC', registrationNumber: 'EIN-12-3456789', taxId: '12-3456789', country: 'USA', state: 'Delaware', isDefault: false, _count: { employees: 26 } },
        ];
      }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: '', registrationNumber: '', taxId: '', country: '', state: '' } });

  const openCreate = () => { setEditing(null); form.reset(); setOpen(true); };
  const openEdit = (e: LegalEntity) => { setEditing(e); form.reset({ name: e.name, registrationNumber: e.registrationNumber, taxId: e.taxId, country: e.country, state: e.state }); setOpen(true); };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/organization/legal-entities/${editing.id}`, data);
      else await api.post('/organization/legal-entities', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-entities'] });
      toast({ title: editing ? 'Entity updated' : 'Entity created' });
      setOpen(false);
    },
    onError: () => toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organization/legal-entities/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal-entities'] }); toast({ title: 'Entity deleted' }); },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Legal Entities"
        description="Manage your company's legal entities and registration details."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Entity</Button>}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2].map(i => <Card key={i}><CardContent className="pt-6 h-40" /></Card>)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <Card key={entity.id} className="relative group hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{entity.name}</h3>
                      {entity.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Reg: {entity.registrationNumber}</p>
                    <p className="text-xs text-muted-foreground">Tax: {entity.taxId}</p>
                    <p className="text-xs text-muted-foreground">{entity.state}, {entity.country}</p>
                    <p className="text-xs text-primary mt-2 font-medium">{entity._count?.employees ?? 0} employees</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(entity)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(entity.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Legal Entity' : 'Add Legal Entity'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Entity Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                  <FormItem><FormLabel>Registration No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taxId" render={({ field }) => (
                  <FormItem><FormLabel>Tax ID / GST</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
