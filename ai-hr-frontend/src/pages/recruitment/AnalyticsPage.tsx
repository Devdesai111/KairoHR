import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const mockData = {
  stats: { totalApplications: 185, hired: 12, avgTimeToHire: 28, offerAcceptRate: 87 },
  byStage: [
    { stage: 'New', count: 45 }, { stage: 'Screening', count: 38 }, { stage: 'Technical', count: 25 },
    { stage: 'HR Interview', count: 18 }, { stage: 'Offer', count: 15 }, { stage: 'Hired', count: 12 },
  ],
  byDept: [
    { dept: 'Engineering', count: 78 }, { dept: 'Product', count: 23 }, { dept: 'Design', count: 38 },
    { dept: 'Sales', count: 25 }, { dept: 'Finance', count: 12 }, { dept: 'HR', count: 9 },
  ],
  trend: [
    { month: 'Sep', applications: 28, hired: 4 }, { month: 'Oct', applications: 35, hired: 5 },
    { month: 'Nov', applications: 42, hired: 6 }, { month: 'Dec', applications: 38, hired: 4 },
    { month: 'Jan', applications: 52, hired: 8 }, { month: 'Feb', applications: 45, hired: 7 },
  ],
  sourceData: [
    { name: 'LinkedIn', value: 45 }, { name: 'Referrals', value: 25 }, { name: 'Job Boards', value: 18 },
    { name: 'Company Site', value: 8 }, { name: 'Others', value: 4 },
  ],
};

export default function AnalyticsPage() {
  const { data = mockData } = useQuery({
    queryKey: ['recruitment-analytics'],
    queryFn: async () => {
      try { const r = await api.get('/recruitment/analytics'); return r.data.data ?? mockData; }
      catch { return mockData; }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Recruitment Analytics" description="Insights into your hiring pipeline and performance." />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Applications" value={data.stats.totalApplications} icon={<Users className="h-5 w-5" />} trend={{ value: 15, isPositive: true, label: 'vs last quarter' }} />
        <StatCard title="Hired This Quarter" value={data.stats.hired} icon={<Target className="h-5 w-5" />} trend={{ value: 20, isPositive: true }} />
        <StatCard title="Avg. Time to Hire" value={`${data.stats.avgTimeToHire}d`} icon={<Clock className="h-5 w-5" />} trend={{ value: 3, isPositive: false, label: 'days longer' }} description="days from application to offer" />
        <StatCard title="Offer Acceptance" value={`${data.stats.offerAcceptRate}%`} icon={<TrendingUp className="h-5 w-5" />} trend={{ value: 5, isPositive: true }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hiring Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">Hiring Trend (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Applications" />
                <Line type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Hired" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline by Stage */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.byStage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Applications by Department */}
        <Card>
          <CardHeader><CardTitle className="text-base">Applications by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.byDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Applications">
                  {data.byDept.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Mix */}
        <Card>
          <CardHeader><CardTitle className="text-base">Candidate Source Mix</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={data.sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {data.sourceData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.sourceData.map((s: { name: string; value: number }, i: number) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium ml-auto">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
