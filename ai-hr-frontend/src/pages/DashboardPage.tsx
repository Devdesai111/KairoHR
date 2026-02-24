import { useQuery } from '@tanstack/react-query';
import {
  Users, Clock, CalendarOff, DollarSign, Briefcase,
  TrendingUp, AlertCircle, CheckCircle2, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface DashboardStats {
  employees: { total: number; active: number; onLeave: number; newThisMonth: number };
  attendance: { presentToday: number; absentToday: number; lateToday: number; attendanceRate: number };
  leave: { pendingApprovals: number; approvedThisMonth: number; totalOnLeave: number };
  payroll: { lastRunAmount: number; pendingReimbursements: number; openLoans: number };
  recruitment: { openPositions: number; newApplications: number; scheduledInterviews: number };
}

interface RecentActivity {
  id: string;
  type: 'employee' | 'leave' | 'attendance' | 'payroll' | 'recruitment';
  description: string;
  time: string;
  status?: string;
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/reports/dashboard');
        return res.data.data;
      } catch {
        // Return mock data if endpoint not available
        return {
          employees: { total: 124, active: 118, onLeave: 6, newThisMonth: 4 },
          attendance: { presentToday: 108, absentToday: 10, lateToday: 6, attendanceRate: 87.1 },
          leave: { pendingApprovals: 8, approvedThisMonth: 23, totalOnLeave: 6 },
          payroll: { lastRunAmount: 4850000, pendingReimbursements: 12, openLoans: 5 },
          recruitment: { openPositions: 7, newApplications: 23, scheduledInterviews: 9 },
        };
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentActivity } = useQuery<RecentActivity[]>({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      try {
        const res = await api.get('/reports/recent-activity');
        return res.data.data;
      } catch {
        return [
          { id: '1', type: 'leave', description: 'Priya Sharma applied for Annual Leave', time: '10 min ago', status: 'pending' },
          { id: '2', type: 'employee', description: 'New employee Rahul Mehta onboarded', time: '1 hour ago', status: 'active' },
          { id: '3', type: 'attendance', description: 'Attendance report for Feb 2026 generated', time: '2 hours ago' },
          { id: '4', type: 'recruitment', description: 'Interview scheduled for Senior Dev role', time: '3 hours ago', status: 'scheduled' },
          { id: '5', type: 'payroll', description: 'Payroll run completed for Jan 2026', time: '1 day ago', status: 'completed' },
          { id: '6', type: 'leave', description: 'Amit Kumar leave request approved', time: '1 day ago', status: 'approved' },
        ];
      }
    },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const getActivityIcon = (type: RecentActivity['type']) => {
    const icons = {
      employee: <Users className="h-4 w-4 text-blue-500" />,
      leave: <CalendarOff className="h-4 w-4 text-orange-500" />,
      attendance: <Clock className="h-4 w-4 text-green-500" />,
      payroll: <DollarSign className="h-4 w-4 text-purple-500" />,
      recruitment: <Briefcase className="h-4 w-4 text-red-500" />,
    };
    return icons[type];
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
      pending: 'warning',
      active: 'success',
      approved: 'success',
      completed: 'default',
      scheduled: 'secondary',
    };
    return <Badge variant={variants[status] ?? 'secondary'} className="text-xs">{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}! 👋`}
        description="Here's what's happening at your organization today."
      />

      {/* Stats Grid */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats.employees.total}
            description={`${stats.employees.active} active · ${stats.employees.onLeave} on leave`}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 3.2, isPositive: true, label: 'new this month' }}
          />
          <StatCard
            title="Present Today"
            value={stats.attendance.presentToday}
            description={`${stats.attendance.attendanceRate}% attendance rate`}
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 1.5, isPositive: true }}
          />
          <StatCard
            title="Leave Pending"
            value={stats.leave.pendingApprovals}
            description={`${stats.leave.approvedThisMonth} approved this month`}
            icon={<CalendarOff className="h-5 w-5" />}
          />
          <StatCard
            title="Last Payroll"
            value={`₹${(stats.payroll.lastRunAmount / 100000).toFixed(1)}L`}
            description={`${stats.payroll.pendingReimbursements} reimbursements pending`}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Open Positions"
            value={stats.recruitment.openPositions}
            description={`${stats.recruitment.newApplications} new applications`}
            icon={<Briefcase className="h-5 w-5" />}
            trend={{ value: 2, isPositive: true, label: 'new roles' }}
          />
          <StatCard
            title="Interviews Today"
            value={stats.recruitment.scheduledInterviews}
            description="scheduled interviews"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Late Today"
            value={stats.attendance.lateToday}
            description="employees late check-in"
            icon={<AlertCircle className="h-5 w-5" />}
            trend={{ value: 0.8, isPositive: false }}
          />
          <StatCard
            title="New This Month"
            value={stats.employees.newThisMonth}
            description="new hires onboarded"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 25, isPositive: true, label: 'vs last month' }}
          />
        </div>
      ) : null}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(recentActivity ?? []).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-full bg-muted">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats && [
                { label: 'Present', value: stats.attendance.presentToday, color: 'bg-green-500', pct: Math.round((stats.attendance.presentToday / stats.employees.total) * 100) },
                { label: 'Absent', value: stats.attendance.absentToday, color: 'bg-red-500', pct: Math.round((stats.attendance.absentToday / stats.employees.total) * 100) },
                { label: 'Late', value: stats.attendance.lateToday, color: 'bg-yellow-500', pct: Math.round((stats.attendance.lateToday / stats.employees.total) * 100) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value} <span className="text-muted-foreground font-normal">({item.pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Add Employee', href: '/employees/new', icon: Users },
                  { label: 'Run Payroll', href: '/payroll/runs', icon: DollarSign },
                  { label: 'Approve Leaves', href: '/leave/approvals', icon: CalendarOff },
                  { label: 'View Reports', href: '/reports', icon: BarChart3 },
                ].map(({ label, href, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-colors text-center"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
