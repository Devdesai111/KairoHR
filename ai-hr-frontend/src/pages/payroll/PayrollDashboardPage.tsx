import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, FileText, Play, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface PayrollSummary {
  currentMonth: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeeCount: number;
  completionPct: number;
}

interface RecentRun {
  id: string;
  month: string;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
  status: string;
  runDate: string;
}

const mockSummary: PayrollSummary = {
  currentMonth: 'February 2026',
  status: 'NOT_STARTED',
  totalGross: 0,
  totalNet: 0,
  totalDeductions: 0,
  employeeCount: 118,
  completionPct: 0,
};

const mockRuns: RecentRun[] = [
  { id: '1', month: 'January 2026', totalGross: 24850000, totalNet: 19880000, employeeCount: 115, status: 'COMPLETED', runDate: '2026-01-31' },
  { id: '2', month: 'December 2025', totalGross: 24200000, totalNet: 19360000, employeeCount: 112, status: 'COMPLETED', runDate: '2025-12-31' },
  { id: '3', month: 'November 2025', totalGross: 23900000, totalNet: 19120000, employeeCount: 110, status: 'COMPLETED', runDate: '2025-11-30' },
];

export default function PayrollDashboardPage() {
  const { data: summary = mockSummary } = useQuery<PayrollSummary>({
    queryKey: ['payroll-summary'],
    queryFn: async () => {
      try { const r = await api.get('/payroll/summary'); return r.data.data; }
      catch { return mockSummary; }
    },
  });

  const { data: recentRuns = mockRuns } = useQuery<RecentRun[]>({
    queryKey: ['payroll-runs-recent'],
    queryFn: async () => {
      try { const r = await api.get('/payroll/runs', { params: { limit: 5 } }); return r.data.data?.data ?? []; }
      catch { return mockRuns; }
    },
  });

  const lastRun = recentRuns[0];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Payroll"
        description="Manage salary processing, payslips and employee compensation."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/payroll/payslips"><FileText className="h-4 w-4 mr-2" />Payslips</Link></Button>
            <Button asChild><Link to="/payroll/runs"><Play className="h-4 w-4 mr-2" />Run Payroll</Link></Button>
          </div>
        }
      />

      {/* Current Month Status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Month</p>
              <h2 className="text-2xl font-bold">{summary.currentMonth}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={summary.status === 'COMPLETED' ? 'success' : summary.status === 'IN_PROGRESS' ? 'warning' : 'secondary'}>
                  {summary.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : summary.status === 'IN_PROGRESS' ? <Clock className="h-3 w-3 mr-1" /> : null}
                  {summary.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">{summary.employeeCount} employees</span>
              </div>
            </div>
            {summary.status === 'NOT_STARTED' && (
              <Button size="lg" asChild>
                <Link to="/payroll/runs"><Play className="h-5 w-5 mr-2" />Start Payroll Run</Link>
              </Button>
            )}
            {summary.status === 'IN_PROGRESS' && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Processing: {summary.completionPct}%</p>
                <Progress value={summary.completionPct} className="w-40 h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {lastRun && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Last Month Gross"
            value={`₹${(lastRun.totalGross / 100000).toFixed(1)}L`}
            description="January 2026 payroll"
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: 2.7, isPositive: true }}
          />
          <StatCard
            title="Net Disbursed"
            value={`₹${(lastRun.totalNet / 100000).toFixed(1)}L`}
            description="After all deductions"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Employees Paid"
            value={lastRun.employeeCount}
            description="in last payroll run"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Deductions"
            value={`₹${((lastRun.totalGross - lastRun.totalNet) / 100000).toFixed(1)}L`}
            description="PF, PT, TDS, etc."
            icon={<FileText className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Salary Templates', desc: 'Configure pay structures', href: '/payroll/templates', icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { label: 'Payroll Runs', desc: 'View run history', href: '/payroll/runs', icon: Play, color: 'text-green-600 bg-green-50' },
          { label: 'Reimbursements', desc: 'Expense claims', href: '/payroll/reimbursements', icon: DollarSign, color: 'text-orange-600 bg-orange-50' },
          { label: 'Loans & Advances', desc: 'Salary advances', href: '/payroll/loans', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, desc, href, icon: Icon, color }) => (
          <Link key={href} to={href}>
            <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardContent className="pt-4 pb-4">
                <div className={`p-2 rounded-lg w-fit mb-2 ${color.split(' ')[1]}`}>
                  <Icon className={`h-5 w-5 ${color.split(' ')[0]}`} />
                </div>
                <p className="font-medium text-sm group-hover:text-primary transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Payroll Runs</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/payroll/runs">View all</Link></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-sm">{run.month}</p>
                  <p className="text-xs text-muted-foreground">{run.employeeCount} employees · Processed {formatDate(run.runDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{(run.totalGross / 100000).toFixed(1)}L gross</p>
                  <p className="text-xs text-muted-foreground">₹{(run.totalNet / 100000).toFixed(1)}L net</p>
                </div>
                <Badge variant="success" className="ml-4">Completed</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
