import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Video, Users, Clock, MapPin, Loader2, Calendar, CheckCircle } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';

interface Meeting {
  id: string;
  title: string;
  type: 'ONE_ON_ONE' | 'TEAM' | 'ALL_HANDS' | 'INTERVIEW' | 'PERFORMANCE_REVIEW';
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  agenda?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  participants: string[];
  organizer: string;
}

const mockMeetings: Meeting[] = [
  { id: '1', title: 'Sprint Planning - Feb 2026', type: 'TEAM', startTime: '2026-02-24T10:00:00', endTime: '2026-02-24T11:30:00', meetingLink: 'https://meet.google.com/abc-defg', agenda: 'Plan sprint goals for February 2026', status: 'SCHEDULED', participants: ['Priya Sharma', 'Rahul Mehta', 'Amit Kumar', 'Anjali Patel'], organizer: 'Vikram Nair' },
  { id: '2', title: '1:1 with Priya', type: 'ONE_ON_ONE', startTime: '2026-02-24T14:00:00', endTime: '2026-02-24T14:30:00', location: 'Conference Room A', status: 'SCHEDULED', participants: ['Priya Sharma'], organizer: 'Vikram Nair' },
  { id: '3', title: 'All Hands - Feb 2026', type: 'ALL_HANDS', startTime: '2026-02-28T16:00:00', endTime: '2026-02-28T17:30:00', meetingLink: 'https://meet.google.com/xyz-uvwx', agenda: 'Q1 review and company updates', status: 'SCHEDULED', participants: ['All Employees'], organizer: 'Arjun Malhotra' },
  { id: '4', title: 'Technical Interview - Arjun Kapoor', type: 'INTERVIEW', startTime: '2026-02-23T11:00:00', endTime: '2026-02-23T12:00:00', meetingLink: 'https://meet.google.com/int-view', status: 'COMPLETED', participants: ['Priya Sharma', 'Vikram Nair'], organizer: 'Sneha Joshi' },
];

const typeConfig = {
  ONE_ON_ONE: { label: '1:1', variant: 'secondary' as const, icon: Users },
  TEAM: { label: 'Team', variant: 'info' as const, icon: Users },
  ALL_HANDS: { label: 'All Hands', variant: 'default' as const, icon: Users },
  INTERVIEW: { label: 'Interview', variant: 'warning' as const, icon: Users },
  PERFORMANCE_REVIEW: { label: 'Perf Review', variant: 'secondary' as const, icon: Users },
};

const statusVariant: Record<string, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  SCHEDULED: 'secondary', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'destructive',
};

const schema = z.object({
  title: z.string().min(3),
  type: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  agenda: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function MeetingsPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      try { const r = await api.get('/meetings'); return r.data.data?.data ?? []; }
      catch { return mockMeetings; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { title: '', type: 'TEAM', startTime: '', endTime: '' } });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/meetings', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meetings'] }); toast({ title: 'Meeting scheduled!' }); setOpen(false); form.reset(); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const upcoming = meetings.filter(m => m.status === 'SCHEDULED' && new Date(m.startTime) >= new Date());
  const past = meetings.filter(m => m.status === 'COMPLETED' || new Date(m.startTime) < new Date());

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const typeCfg = typeConfig[meeting.type] ?? typeConfig.TEAM;
    const TypeIcon = typeCfg.icon;
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><TypeIcon className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-semibold text-sm flex-1">{meeting.title}</h3>
                <div className="flex gap-1 shrink-0">
                  <Badge variant={typeCfg.variant} className="text-xs">{typeCfg.label}</Badge>
                  <Badge variant={statusVariant[meeting.status]} className="text-xs">{meeting.status}</Badge>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{formatDateTime(meeting.startTime)} — {meeting.endTime.split('T')[1].slice(0, 5)}</div>
                {meeting.location && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{meeting.location}</div>}
                {meeting.meetingLink && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Video className="h-3.5 w-3.5" /><a href={meeting.meetingLink} className="text-primary hover:underline">Join Meeting</a></div>}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{meeting.participants.join(', ')}</div>
              </div>
              {meeting.agenda && <p className="mt-2 text-xs text-muted-foreground italic">{meeting.agenda}</p>}
              <p className="mt-1.5 text-xs text-muted-foreground">By {meeting.organizer}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Meetings"
        description="Schedule and manage team meetings and reviews."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><a href="/meetings/calendar">Calendar View</a></Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Schedule Meeting</Button>
          </div>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming <Badge variant="secondary" className="ml-2 h-5 text-xs">{upcoming.length}</Badge></TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            {upcoming.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" /><p>No upcoming meetings.</p></div>
            ) : upcoming.map(m => <MeetingCard key={m.id} meeting={m} />)}
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            {past.map(m => <MeetingCard key={m.id} meeting={m} />)}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Meeting</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Meeting Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>End</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} placeholder="Conference Room A" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="meetingLink" render={({ field }) => (
                <FormItem><FormLabel>Meeting Link</FormLabel><FormControl><Input {...field} placeholder="https://meet.google.com/..." /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="agenda" render={({ field }) => (
                <FormItem><FormLabel>Agenda</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Schedule
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
