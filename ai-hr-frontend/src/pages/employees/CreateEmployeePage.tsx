import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

const schema = z.object({
  // User info
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  // Employment
  employeeId: z.string().min(1, 'Employee ID required'),
  designation: z.string().min(1, 'Designation required'),
  departmentId: z.string().min(1, 'Department required'),
  locationId: z.string().optional(),
  managerId: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  joinDate: z.string().min(1, 'Join date required'),
  // Salary
  basic: z.coerce.number().min(1, 'Basic salary required'),
  hra: z.coerce.number().min(0),
  special: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

const mockDepts = [
  { id: 'd1', name: 'Engineering' }, { id: 'd2', name: 'Product' }, { id: 'd3', name: 'Design' },
  { id: 'd4', name: 'Marketing' }, { id: 'd5', name: 'Sales' }, { id: 'd6', name: 'Finance' }, { id: 'd7', name: 'Human Resources' },
];
const mockLocations = [
  { id: 'l1', name: 'Mumbai HQ' }, { id: 'l2', name: 'Bangalore Office' }, { id: 'l3', name: 'Delhi NCR' },
];

export default function CreateEmployeePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const { data: departments = mockDepts } = useQuery({
    queryKey: ['departments-simple'],
    queryFn: async () => {
      try { const r = await api.get('/organization/departments'); return r.data.data ?? mockDepts; }
      catch { return mockDepts; }
    },
  });

  const { data: locations = mockLocations } = useQuery({
    queryKey: ['locations-simple'],
    queryFn: async () => {
      try { const r = await api.get('/organization/locations'); return r.data.data ?? mockLocations; }
      catch { return mockLocations; }
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: 'FULL_TIME', basic: 0, hra: 0, special: 0,
      name: '', email: '', employeeId: '', designation: '', joinDate: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post('/employees', {
        user: { name: data.name, email: data.email, phone: data.phone },
        employeeId: data.employeeId,
        designation: data.designation,
        departmentId: data.departmentId,
        locationId: data.locationId,
        managerId: data.managerId,
        employmentType: data.employmentType,
        joinDate: data.joinDate,
        salary: { basic: data.basic, hra: data.hra, special: data.special },
      });
    },
    onSuccess: () => {
      toast({ title: 'Employee created successfully!' });
      navigate('/employees');
    },
    onError: (err: Error) => {
      toast({ title: 'Error creating employee', description: err.message, variant: 'destructive' });
    },
  });

  const steps = [
    { id: 1, label: 'Personal Info' },
    { id: 2, label: 'Employment' },
    { id: 3, label: 'Compensation' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/employees"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-xl font-bold">Add New Employee</h1>
          <p className="text-sm text-muted-foreground">Fill in the details to onboard a new employee</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step === s.id ? 'text-primary font-semibold' : step > s.id ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s.id ? 'border-primary bg-primary text-white' : step > s.id ? 'border-green-600 bg-green-600 text-white' : 'border-muted-foreground'}`}>{s.id}</div>
              <span className="text-sm">{s.label}</span>
            </div>
            {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))}>
          {/* Step 1: Personal */}
          {step === 1 && (
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} placeholder="Priya Sharma" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="+91 98765 43210" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep(2)}>Next: Employment →</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Employment */}
          {step === 2 && (
            <Card>
              <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="employeeId" render={({ field }) => (
                    <FormItem><FormLabel>Employee ID *</FormLabel><FormControl><Input {...field} placeholder="EMP010" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="joinDate" render={({ field }) => (
                    <FormItem><FormLabel>Join Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="designation" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Designation *</FormLabel><FormControl><Input {...field} placeholder="Software Engineer" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                        <SelectContent>{departments.map((d: { id: string; name: string }) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="locationId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                        <SelectContent>{locations.map((l: { id: string; name: string }) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="employmentType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERN">Intern</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
                  <Button type="button" onClick={() => setStep(3)}>Next: Compensation →</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Salary */}
          {step === 3 && (
            <Card>
              <CardHeader><CardTitle>Compensation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="basic" render={({ field }) => (
                    <FormItem><FormLabel>Basic Salary (₹) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hra" render={({ field }) => (
                    <FormItem><FormLabel>HRA (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="special" render={({ field }) => (
                    <FormItem><FormLabel>Special Allowance (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                {(() => {
                  const b = form.watch('basic') || 0;
                  const h = form.watch('hra') || 0;
                  const s = form.watch('special') || 0;
                  const gross = b + h + s;
                  return gross > 0 ? (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-muted-foreground">Gross Monthly CTC</p>
                      <p className="text-2xl font-bold text-primary">₹{gross.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground">Annual: ₹{(gross * 12).toLocaleString('en-IN')}</p>
                    </div>
                  ) : null;
                })()}
                <Separator />
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Employee
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
