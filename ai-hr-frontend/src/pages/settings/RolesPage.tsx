import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  userCount: number;
  permissions: Record<string, boolean>;
}

const permissionModules = [
  { key: 'employees', label: 'Employees' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leave', label: 'Leave' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'recruitment', label: 'Recruitment' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'grievance', label: 'Grievance' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

const mockRoles: Role[] = [
  {
    id: '1', name: 'SUPER_ADMIN', displayName: 'Super Admin', description: 'Full access to all modules and settings', userCount: 1,
    permissions: { employees: true, attendance: true, leave: true, payroll: true, recruitment: true, meetings: true, grievance: true, reports: true, settings: true },
  },
  {
    id: '2', name: 'HR_ADMIN', displayName: 'HR Admin', description: 'Access to all HR functions except financial settings', userCount: 2,
    permissions: { employees: true, attendance: true, leave: true, payroll: true, recruitment: true, meetings: true, grievance: true, reports: true, settings: false },
  },
  {
    id: '3', name: 'MANAGER', displayName: 'Manager', description: 'Team management, leave approval and reporting', userCount: 8,
    permissions: { employees: false, attendance: true, leave: true, payroll: false, recruitment: true, meetings: true, grievance: false, reports: true, settings: false },
  },
  {
    id: '4', name: 'EMPLOYEE', displayName: 'Employee', description: 'Access to own data, apply leave and view own payslips', userCount: 107,
    permissions: { employees: false, attendance: false, leave: true, payroll: false, recruitment: false, meetings: true, grievance: true, reports: false, settings: false },
  },
];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-primary/10 border-primary/30',
  HR_ADMIN: 'bg-green-50 border-green-200',
  MANAGER: 'bg-yellow-50 border-yellow-200',
  EMPLOYEE: 'bg-gray-50 border-gray-200',
};

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data: roles = mockRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      try { const r = await api.get('/roles'); return r.data.data ?? []; }
      catch { return mockRoles; }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Roles & Permissions" description="View access control matrix for all system roles." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">System Roles</h3>
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all border ${selectedRole?.id === role.id ? roleColors[role.name] ?? 'bg-primary/5 border-primary/20' : 'hover:shadow-md'}`}
              onClick={() => setSelectedRole(role)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="font-semibold text-sm">{role.displayName}</p>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                    <p className="text-xs text-primary mt-1 font-medium">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{selectedRole.displayName} Permissions</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                  </div>
                  <Badge className="ml-auto">{selectedRole.userCount} users</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permissionModules.map((module) => {
                    const hasAccess = selectedRole.permissions[module.key];
                    return (
                      <div key={module.key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{module.label}</span>
                        <div className="flex items-center gap-2">
                          {hasAccess ? (
                            <Badge variant="success" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />Access Granted
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <X className="h-3 w-3 mr-1" />No Access
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a role to view permissions</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Matrix */}
      <Card>
        <CardHeader><CardTitle className="text-base">Full Permissions Matrix</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Module</th>
                {roles.map(r => <th key={r.id} className="text-center py-2 px-4 font-medium">{r.displayName}</th>)}
              </tr>
            </thead>
            <tbody>
              {permissionModules.map((module, i) => (
                <tr key={module.key} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className="py-2 pr-4 font-medium">{module.label}</td>
                  {roles.map(role => (
                    <td key={role.id} className="text-center py-2 px-4">
                      {role.permissions[module.key] ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
