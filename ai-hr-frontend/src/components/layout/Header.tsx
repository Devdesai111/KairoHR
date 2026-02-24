import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/lib/utils';

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/organization': 'Organization',
    '/organization/legal-entities': 'Legal Entities',
    '/organization/locations': 'Locations',
    '/organization/departments': 'Departments',
    '/organization/policies': 'HR Policies',
    '/employees': 'Employees',
    '/employees/new': 'Add Employee',
    '/employees/org-chart': 'Org Chart',
    '/attendance': 'Attendance',
    '/attendance/shifts': 'Shifts',
    '/attendance/regularization': 'Regularization',
    '/leave': 'Leave',
    '/leave/apply': 'Apply Leave',
    '/leave/approvals': 'Leave Approvals',
    '/leave/calendar': 'Leave Calendar',
    '/leave/types': 'Leave Types',
    '/payroll': 'Payroll',
    '/payroll/templates': 'Salary Templates',
    '/payroll/runs': 'Payroll Runs',
    '/payroll/payslips': 'Payslips',
    '/payroll/reimbursements': 'Reimbursements',
    '/payroll/loans': 'Loans',
    '/recruitment': 'Recruitment',
    '/recruitment/candidates': 'Candidates',
    '/recruitment/applications': 'Applications',
    '/recruitment/analytics': 'Analytics',
    '/meetings': 'Meetings',
    '/meetings/calendar': 'Meeting Calendar',
    '/grievance': 'Grievance',
    '/reports': 'Reports & Analytics',
    '/settings': 'Settings',
    '/settings/users': 'User Management',
    '/settings/roles': 'Roles & Permissions',
    '/ai-assistant': 'AI Assistant',
  };
  // exact match first
  if (map[pathname]) return map[pathname];
  // partial match for dynamic routes (e.g. /employees/:id)
  if (pathname.startsWith('/employees/')) return 'Employee Details';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    return segments[segments.length - 1]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return 'KairoHR';
}

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
          <Menu className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold text-sm md:text-base">{getPageTitle(location.pathname)}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user?.name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/employees')}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
