import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Pencil, Trash2, Loader2 } from 'lucide-react';
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

interface Location {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isHeadquarters: boolean;
  _count?: { employees: number };
}

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const mockLocations: Location[] = [
  { id: '1', name: 'Mumbai HQ', code: 'MUM', address: 'BKC, Plot C-66', city: 'Mumbai', state: 'Maharashtra', country: 'India', isHeadquarters: true, _count: { employees: 72 } },
  { id: '2', name: 'Bangalore Office', code: 'BLR', address: 'Whitefield, ITPL', city: 'Bangalore', state: 'Karnataka', country: 'India', isHeadquarters: false, _count: { employees: 26 } },
  { id: '3', name: 'Delhi NCR', code: 'DEL', address: 'Cyber Hub, Gurgaon', city: 'Gurgaon', state: 'Haryana', country: 'India', isHeadquarters: false, _count: { employees: 18 } },
  { id: '4', name: 'New York Office', code: 'NYC', address: '350 Fifth Avenue', city: 'New York', state: 'NY', country: 'USA', isHeadquarters: false, _count: { employees: 8 } },
];

export default function LocationsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      try { const res = await api.get('/organization/locations'); return res.data.data ?? []; }
      catch { return mockLocations; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: '', code: '', address: '', city: '', state: '', country: '' } });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/organization/locations/${editing.id}`, data);
      else await api.post('/organization/locations', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); toast({ title: editing ? 'Location updated' : 'Location created' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organization/locations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });

  const openCreate = () => { setEditing(null); form.reset(); setOpen(true); };
  const openEdit = (l: Location) => { setEditing(l); form.reset({ name: l.name, code: l.code, address: l.address, city: l.city, state: l.state, country: l.country }); setOpen(true); };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Locations" description="Office locations and work sites." actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Location</Button>} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Card key={i}><CardContent className="pt-6 h-36" /></Card>)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id} className="relative group hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50"><MapPin className="h-5 w-5 text-green-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{loc.name}</h3>
                      <Badge variant="outline" className="text-xs">{loc.code}</Badge>
                      {loc.isHeadquarters && <Badge className="text-xs">HQ</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{loc.address}</p>
                    <p className="text-xs text-muted-foreground">{loc.city}, {loc.state}</p>
                    <p className="text-xs text-muted-foreground">{loc.country}</p>
                    <p className="text-xs text-primary mt-2 font-medium">{loc._count?.employees ?? 0} employees</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(loc)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(loc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Location Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} placeholder="MUM" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
