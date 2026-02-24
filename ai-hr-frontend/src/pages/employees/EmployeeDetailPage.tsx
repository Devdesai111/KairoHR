import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Edit, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface EmployeeDetail {
  id: string;
  employeeId: string;
  user: { name: string; email: string; avatar?: string };
  department?: { name: string };
  location?: { name: string };
  designation: string;
  employmentType: string;
  status: string;
  joinDate: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
  manager?: { user: { name: string }; designation: string };
  salary?: { basic: number; hra: number; special: number; gross: number };
  leaveBalance?: { annual: number; sick: number; casual: number };
}

const mockEmployee: EmployeeDetail = {
  id: '1', employeeId: 'EMP001',
  user: { name: 'Priya Sharma', email: 'priya@techcorp.com' },
  department: { name: 'Engineering' },
  location: { name: 'Mumbai HQ' },
  designation: 'Senior Software Engineer',
  employmentType: 'FULL_TIME',
  status: 'ACTIVE',
  joinDate: '2023-03-15',
  phone: '+91 98765 43210',
  address: 'Andheri West, Mumbai, Maharashtra 400053',
  bloodGroup: 'B+',
  emergencyContact: { name: 'Rajesh Sharma', phone: '+91 98765 43299', relationship: 'Spouse' },
  manager: { user: { name: 'Vikram Nair' }, designation: 'Engineering Manager' },
  salary: { basic: 120000, hra: 48000, special: 32000, gross: 200000 },
  leaveBalance: { annual: 18, sick: 10, casual: 8 },
};

const statusColors: Record<string, 'success' | 'warning' | 'secondary'> = { ACTIVE: 'success', ON_LEAVE: 'warning', INACTIVE: 'secondary' };

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: emp, isLoading } = useQuery<EmployeeDetail>({
    queryKey: ['employee', id],
    queryFn: async () => {
      try { const res = await api.get(`/employees/${id}`); return res.data.data; }
      catch { return mockEmployee; }
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="pt-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!emp) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link to="/employees"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        <Button size="sm"><Edit className="h-4 w-4 mr-2" />Edit</Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={emp.user.avatar} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{getInitials(emp.user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{emp.user.name}</h1>
                  <Badge variant={statusColors[emp.status] ?? 'secondary'}>{emp.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-muted-foreground">{emp.designation} · {emp.department?.name}</p>
                <p className="text-sm text-muted-foreground">{emp.employeeId}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{emp.user.email}</span>
                {emp.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{emp.phone}</span>}
                {emp.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{emp.location.name}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {formatDate(emp.joinDate)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="salary">Compensation</TabsTrigger>
          <TabsTrigger value="leave">Leave Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <InfoRow label="Full Name" value={emp.user.name} />
              <InfoRow label="Email" value={emp.user.email} />
              <InfoRow label="Phone" value={emp.phone} />
              <InfoRow label="Blood Group" value={emp.bloodGroup} />
              <InfoRow label="Address" value={emp.address} />
              {emp.emergencyContact && (
                <>
                  <Separator className="my-2" />
                  <p className="text-xs font-medium text-muted-foreground py-2">Emergency Contact</p>
                  <InfoRow label="Name" value={emp.emergencyContact.name} />
                  <InfoRow label="Relationship" value={emp.emergencyContact.relationship} />
                  <InfoRow label="Phone" value={emp.emergencyContact.phone} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <InfoRow label="Employee ID" value={emp.employeeId} />
              <InfoRow label="Designation" value={emp.designation} />
              <InfoRow label="Department" value={emp.department?.name} />
              <InfoRow label="Location" value={emp.location?.name} />
              <InfoRow label="Employment Type" value={emp.employmentType.replace('_', ' ')} />
              <InfoRow label="Join Date" value={formatDate(emp.joinDate)} />
              <InfoRow label="Reporting Manager" value={emp.manager ? `${emp.manager.user.name} (${emp.manager.designation})` : undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card>
            <CardHeader><CardTitle className="text-base">Compensation Details</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {emp.salary ? (
                <>
                  <InfoRow label="Basic Salary" value={`₹${emp.salary.basic.toLocaleString('en-IN')}`} />
                  <InfoRow label="HRA" value={`₹${emp.salary.hra.toLocaleString('en-IN')}`} />
                  <InfoRow label="Special Allowance" value={`₹${emp.salary.special.toLocaleString('en-IN')}`} />
                  <div className="flex justify-between py-2 font-semibold">
                    <span className="text-sm">Gross CTC</span>
                    <span className="text-sm text-primary">₹{emp.salary.gross.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground py-4 text-center">No salary information available.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <div className="grid gap-4 sm:grid-cols-3">
            {emp.leaveBalance && [
              { label: 'Annual Leave', value: emp.leaveBalance.annual, color: 'text-blue-600' },
              { label: 'Sick Leave', value: emp.leaveBalance.sick, color: 'text-orange-600' },
              { label: 'Casual Leave', value: emp.leaveBalance.casual, color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="pt-6 text-center">
                  <div className={`text-4xl font-bold ${color}`}>{value}</div>
                  <p className="text-sm text-muted-foreground mt-1">{label} days remaining</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
