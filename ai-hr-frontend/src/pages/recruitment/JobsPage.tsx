import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Briefcase, Users, MapPin, Clock, Pencil, Trash2, Loader2 } from 'lucide-react';
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
import { formatDate } from '@/lib/utils';

interface JobRequisition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  openings: number;
  status: 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'DRAFT';
  postedDate: string;
  applicationsCount: number;
}

const mockJobs: JobRequisition[] = [
  { id: '1', title: 'Senior Software Engineer', department: 'Engineering', location: 'Mumbai / Remote', type: 'Full Time', experience: '4-7 years', openings: 3, status: 'OPEN', postedDate: '2026-02-01', applicationsCount: 45 },
  { id: '2', title: 'Product Manager', department: 'Product', location: 'Mumbai', type: 'Full Time', experience: '5-8 years', openings: 1, status: 'OPEN', postedDate: '2026-02-05', applicationsCount: 23 },
  { id: '3', title: 'UI/UX Designer', department: 'Design', location: 'Bangalore / Remote', type: 'Full Time', experience: '3-5 years', openings: 2, status: 'OPEN', postedDate: '2026-01-28', applicationsCount: 38 },
  { id: '4', title: 'Sales Manager', department: 'Sales', location: 'Delhi', type: 'Full Time', experience: '6-10 years', openings: 1, status: 'ON_HOLD', postedDate: '2026-01-15', applicationsCount: 12 },
  { id: '5', title: 'Data Analyst', department: 'Engineering', location: 'Mumbai', type: 'Full Time', experience: '2-4 years', openings: 2, status: 'OPEN', postedDate: '2026-02-10', applicationsCount: 67 },
];

const schema = z.object({
  title: z.string().min(3),
  department: z.string().min(1),
  location: z.string().min(1),
  type: z.string().min(1),
  experience: z.string().min(1),
  openings: z.coerce.number().min(1),
  description: z.string().min(20),
});
type FormData = z.infer<typeof schema>;

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  OPEN: 'success', ON_HOLD: 'warning', CLOSED: 'secondary', DRAFT: 'secondary',
};

export default function JobsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobRequisition | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: jobs = [] } = useQuery<JobRequisition[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      try { const r = await api.get('/recruitment/jobs'); return r.data.data?.data ?? []; }
      catch { return mockJobs; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { title: '', department: '', location: '', type: 'Full Time', experience: '', openings: 1, description: '' } });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/recruitment/jobs/${editing.id}`, data);
      else await api.post('/recruitment/jobs', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast({ title: editing ? 'Job updated' : 'Job posted!' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const statusCounts = {
    OPEN: jobs.filter(j => j.status === 'OPEN').length,
    ON_HOLD: jobs.filter(j => j.status === 'ON_HOLD').length,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Job Openings"
        description={`${statusCounts.OPEN} open positions across all departments`}
        actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Post Job</Button>}
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Open', count: jobs.filter(j => j.status === 'OPEN').length, color: 'text-green-600 bg-green-50' },
          { label: 'Total Openings', count: jobs.filter(j => j.status === 'OPEN').reduce((s, j) => s + j.openings, 0), color: 'text-blue-600 bg-blue-50' },
          { label: 'Applications', count: jobs.reduce((s, j) => s + j.applicationsCount, 0), color: 'text-purple-600 bg-purple-50' },
          { label: 'On Hold', count: jobs.filter(j => j.status === 'ON_HOLD').length, color: 'text-yellow-600 bg-yellow-50' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-xl ${color.split(' ')[1]} p-4`}>
            <div className={`text-2xl font-bold ${color.split(' ')[0]}`}>{count}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Job Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="relative group hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Briefcase className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">{job.title}</h3>
                    <p className="text-xs text-muted-foreground">{job.department}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[job.status]} className="text-xs">{job.status.replace('_', ' ')}</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{job.location}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{job.experience} exp · {job.type}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{job.applicationsCount} applications</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Openings:</span>
                  <Badge variant="outline" className="text-xs">{job.openings}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">Posted {formatDate(job.postedDate)}</span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(job); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Job' : 'Post New Job'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} placeholder="Senior Software Engineer" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Full Time">Full Time</SelectItem>
                        <SelectItem value="Part Time">Part Time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="experience" render={({ field }) => (
                  <FormItem><FormLabel>Experience</FormLabel><FormControl><Input {...field} placeholder="3-5 years" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="openings" render={({ field }) => (
                  <FormItem><FormLabel>No. of Openings</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea rows={4} {...field} placeholder="Describe the role, responsibilities and requirements..." /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Update' : 'Post Job'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
