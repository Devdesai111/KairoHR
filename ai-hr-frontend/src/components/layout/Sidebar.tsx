import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Clock, CalendarOff, DollarSign,
  Briefcase, Video, AlertTriangle, BarChart3, Bot, Settings,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  label: string;
  to: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: 'HR MODULES',
    items: [
      {
        label: 'Organization', to: '/organization', icon: <Building2 className="h-4 w-4" />,
        children: [
          { label: 'Overview', to: '/organization' },
          { label: 'Legal Entities', to: '/organization/legal-entities' },
          { label: 'Locations', to: '/organization/locations' },
          { label: 'Departments', to: '/organization/departments' },
          { label: 'Policies', to: '/organization/policies' },
        ],
      },
      {
        label: 'Employees', to: '/employees', icon: <Users className="h-4 w-4" />,
        children: [
          { label: 'Directory', to: '/employees' },
          { label: 'Org Chart', to: '/employees/org-chart' },
          { label: 'Add Employee', to: '/employees/new' },
        ],
      },
      {
        label: 'Attendance', to: '/attendance', icon: <Clock className="h-4 w-4" />,
        children: [
          { label: 'Dashboard', to: '/attendance' },
          { label: 'Shifts', to: '/attendance/shifts' },
          { label: 'Regularization', to: '/attendance/regularization' },
        ],
      },
      {
        label: 'Leave', to: '/leave', icon: <CalendarOff className="h-4 w-4" />,
        children: [
          { label: 'My Leave', to: '/leave' },
          { label: 'Apply Leave', to: '/leave/apply' },
          { label: 'Approvals', to: '/leave/approvals' },
          { label: 'Calendar', to: '/leave/calendar' },
          { label: 'Leave Types', to: '/leave/types' },
        ],
      },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      {
        label: 'Payroll', to: '/payroll', icon: <DollarSign className="h-4 w-4" />,
        children: [
          { label: 'Dashboard', to: '/payroll' },
          { label: 'Salary Templates', to: '/payroll/templates' },
          { label: 'Run Payroll', to: '/payroll/runs' },
          { label: 'Payslips', to: '/payroll/payslips' },
          { label: 'Reimbursements', to: '/payroll/reimbursements' },
          { label: 'Loans', to: '/payroll/loans' },
        ],
      },
    ],
  },
  {
    label: 'TALENT',
    items: [
      {
        label: 'Recruitment', to: '/recruitment', icon: <Briefcase className="h-4 w-4" />,
        children: [
          { label: 'Jobs', to: '/recruitment' },
          { label: 'Candidates', to: '/recruitment/candidates' },
          { label: 'Applications', to: '/recruitment/applications' },
          { label: 'Analytics', to: '/recruitment/analytics' },
        ],
      },
      {
        label: 'Meetings', to: '/meetings', icon: <Video className="h-4 w-4" />,
        children: [
          { label: 'All Meetings', to: '/meetings' },
          { label: 'Calendar', to: '/meetings/calendar' },
        ],
      },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Grievance', to: '/grievance', icon: <AlertTriangle className="h-4 w-4" /> },
      { label: 'Reports', to: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
      { label: 'AI Assistant', to: '/ai-assistant', icon: <Bot className="h-4 w-4" /> },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      {
        label: 'Settings', to: '/settings', icon: <Settings className="h-4 w-4" />,
        children: [
          { label: 'General', to: '/settings' },
          { label: 'Users', to: '/settings/users' },
          { label: 'Roles & Permissions', to: '/settings/roles' },
        ],
      },
    ],
  },
];

function NavItemComponent({ item, isOpen: sidebarOpen }: { item: NavItem; isOpen: boolean }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    if (!item.children) return false;
    return item.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + '/'));
  });

  const isActive = !item.children
    ? location.pathname === item.to
    : item.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + '/'));

  if (item.children && sidebarOpen) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive
              ? 'text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {expanded && (
          <div className="ml-7 mt-1 space-y-1 border-l border-border pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                end={child.to === item.to}
                className={({ isActive }) =>
                  cn(
                    'block px-2 py-1.5 rounded text-xs transition-colors',
                    isActive
                      ? 'text-primary font-medium bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={!item.children}
      title={!sidebarOpen ? item.label : undefined}
      className={({ isActive: navActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          (navActive || isActive)
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )
      }
    >
      {item.icon}
      {sidebarOpen && <span>{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const { user } = useAuthStore();

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card border-r transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <div className="bg-primary rounded-lg p-1.5 shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-bold text-lg tracking-tight">KairoHR</span>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {sidebarOpen && (
                <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItemComponent key={item.to} item={item} isOpen={sidebarOpen} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Footer */}
      {user && (
        <div className="border-t p-3">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(user.name || user.email)}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
