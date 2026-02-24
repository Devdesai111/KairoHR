import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, Loader2, Building2, Globe, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

const schema = z.object({
  organizationName: z.string().min(2),
  website: z.string().optional(),
  industry: z.string().min(1),
  country: z.string().min(1),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  dateFormat: z.string().min(1),
  fiscalYearStart: z.string().min(1),
  enableAI: z.boolean(),
  enableEmailNotifications: z.boolean(),
  enableSlackNotifications: z.boolean(),
  workingDays: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

const timezones = ['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Singapore'];
const currencies = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];
const industries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Consulting'];
const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try { const r = await api.get('/settings'); return r.data.data; }
      catch { return null; }
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: settings?.organizationName ?? 'TechCorp Inc.',
      website: settings?.website ?? 'https://techcorp.com',
      industry: settings?.industry ?? 'Technology',
      country: settings?.country ?? 'India',
      timezone: settings?.timezone ?? 'Asia/Kolkata',
      currency: settings?.currency ?? 'INR',
      dateFormat: settings?.dateFormat ?? 'DD/MM/YYYY',
      fiscalYearStart: settings?.fiscalYearStart ?? 'April',
      enableAI: settings?.enableAI ?? true,
      enableEmailNotifications: settings?.enableEmailNotifications ?? true,
      enableSlackNotifications: settings?.enableSlackNotifications ?? false,
      workingDays: settings?.workingDays ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.patch('/settings', data),
    onSuccess: () => toast({ title: 'Settings saved successfully!' }),
    onError: () => toast({ title: 'Error saving settings', variant: 'destructive' }),
  });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Configure your organization preferences and integrations." />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">

          {/* Organization */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><CardTitle className="text-base">Organization</CardTitle></div>
              <CardDescription>Basic company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="organizationName" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Organization Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><CardTitle className="text-base">Localization</CardTitle></div>
              <CardDescription>Timezone, currency and date format settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="timezone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{timezones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="dateFormat" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{dateFormats.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="fiscalYearStart" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year Start</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Features & Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /><CardTitle className="text-base">Features & Notifications</CardTitle></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'enableAI' as const, label: 'AI Assistant', description: 'Enable KairoHR AI-powered features and assistant' },
                { name: 'enableEmailNotifications' as const, label: 'Email Notifications', description: 'Send email alerts for approvals, updates and reminders' },
                { name: 'enableSlackNotifications' as const, label: 'Slack Integration', description: 'Post notifications to Slack channels' },
              ].map(({ name, label, description }) => (
                <div key={name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <FormField control={form.control} name={name} render={({ field }) => (
                    <FormItem><FormControl><Switch checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl></FormItem>
                  )} />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Settings</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
