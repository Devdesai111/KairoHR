import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';

interface Employee {
  id: string;
  employeeId: string;
  user: { name: string; email: string; avatar?: string };
  department?: { name: string };
  designation: string;
  employmentType: string;
  status: string;
  joinDate: string;
  phone?: string;
}

const mockEmployees: Employee[] = [
  { id: '1', employeeId: 'EMP001', user: { name: 'Priya Sharma', email: 'priya@techcorp.com' }, department: { name: 'Engineering' }, designation: 'Senior Engineer', employmentType: 'FULL_TIME', status: 'ACTIVE', joinDate: '2023-03-15', phone: '+91 98765 43210' },
  { id: '2', employeeId: 'EMP002', user: { name: 'Rahul Mehta', email: 'rahul@techcorp.com' }, department: { name: 'Product' }, designation: 'Product Manager', employmentType: 'FULL_TIME', status: 'ACTIVE', joinDate: '2022-07-01', phone: '+91 98765 43211' },
  { id: '3', employeeId: 'EMP003', user: { name: 'Anjali Patel', email: 'anjali@techcorp.com' }, department: { name: 'Design' }, designation: 'UI/UX Designer', employmentType: 'FULL_TIME', status: 'ACTIVE', joinDate: '2023-09-01' },
  { id: '4', employeeId: 'EMP004', user: { name: 'Karan Singh', email: 'karan@techcorp.com' }, department: { name: 'Sales' }, designation: 'Sales Manager', employmentType: 'FULL_TIME', status: 'ACTIVE', joinDate: '2021-05-12' },
  { id: '5', employeeId: 'EMP005', user: { name: 'Neha Gupta', email: 'neha@techcorp.com' }, department: { name: 'Finance' }, designation: 'Financial Analyst', employmentType: 'FULL_TIME', status: 'ON_LEAVE', joinDate: '2022-11-20' },
  { id: '6', employeeId: 'EMP006', user: { name: 'Amit Kumar', email: 'amit@techcorp.com' }, department: { name: 'Engineering' }, designation: 'Backend Developer', employmentType: 'FULL_TIME', status: 'ACTIVE', joinDate: '2024-01-10' },
  { id: '7', employeeId: 'EMP007', user: { name: 'Sneha Joshi', email: 'sneha@techcorp.com' }, department: { name: 'Human Resources' }, designation: 'HR Business Partner', employmentType: 'FULL_TIME', status: 'ACTIVE', joinDate: '2021-08-16' },
  { id: '8', employeeId: 'EMP008', user: { name: 'Vikram Nair', email: 'vikram@techcorp.com' }, department: { name: 'Marketing' }, designation: 'Marketing Lead', employmentType: 'FULL_TIME', status: 'INACTIVE', joinDate: '2022-03-01' },
];

const statusColors: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success', ON_LEAVE: 'warning', INACTIVE: 'secondary', TERMINATED: 'destructive',
};

export default function EmployeeListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees', search, statusFilter, deptFilter],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (deptFilter !== 'ALL') params.department = deptFilter;
        const res = await api.get('/employees', { params });
        return res.data.data?.data ?? res.data.data ?? [];
      } catch {
        let result = mockEmployees;
        if (search) result = result.filter(e => e.user.name.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== 'ALL') result = result.filter(e => e.status === statusFilter);
        return result;
      }
    },
    staleTime: 30000,
  });

  const departments = [...new Set(mockEmployees.map(e => e.department?.name).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Employees"
        description={`${employees.length} total employees`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button asChild size="sm"><Link to="/employees/new"><Plus className="h-4 w-4 mr-2" />Add Employee</Link></Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d!} value={d!}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((emp) => (
            <Card key={emp.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={emp.user.avatar} />
                      <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{getInitials(emp.user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link to={`/employees/${emp.id}`} className="font-semibold text-sm hover:text-primary transition-colors">{emp.user.name}</Link>
                      <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link to={`/employees/${emp.id}`}>View Profile</Link></DropdownMenuItem>
                      <DropdownMenuItem>Edit Employee</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Terminate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-foreground">{emp.designation}</p>
                  <p className="text-xs text-muted-foreground">{emp.department?.name}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={statusColors[emp.status] ?? 'secondary'} className="text-xs">
                    {emp.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex gap-1">
                    <a href={`mailto:${emp.user.email}`}><Button size="icon" variant="ghost" className="h-6 w-6"><Mail className="h-3 w-3" /></Button></a>
                    {emp.phone && <a href={`tel:${emp.phone}`}><Button size="icon" variant="ghost" className="h-6 w-6"><Phone className="h-3 w-3" /></Button></a>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && employees.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Filter className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No employees found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
