import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const mockData = {
  headcountByDept: [
    { dept: 'Engineering', count: 45 }, { dept: 'Sales', count: 22 }, { dept: 'Marketing', count: 15 },
    { dept: 'Finance', count: 12 }, { dept: 'Design', count: 8 }, { dept: 'HR', count: 8 }, { dept: 'Product', count: 10 },
  ],
  attritionTrend: [
    { month: 'Aug', joined: 3, left: 1 }, { month: 'Sep', joined: 4, left: 2 }, { month: 'Oct', joined: 5, left: 1 },
    { month: 'Nov', joined: 3, left: 3 }, { month: 'Dec', joined: 6, left: 2 }, { month: 'Jan', joined: 4, left: 1 },
  ],
  leaveByType: [
    { name: 'Annual', value: 45 }, { name: 'Sick', value: 28 }, { name: 'Casual', value: 18 }, { name: 'Comp Off', value: 6 }, { name: 'Other', value: 3 },
  ],
  payrollTrend: [
    { month: 'Aug', gross: 21.2 }, { month: 'Sep', gross: 22.1 }, { month: 'Oct', gross: 22.8 },
    { month: 'Nov', gross: 23.1 }, { month: 'Dec', gross: 23.9 }, { month: 'Jan', gross: 24.85 },
  ],
  attendanceTrend: [
    { month: 'Aug', rate: 91 }, { month: 'Sep', rate: 89 }, { month: 'Oct', rate: 92 },
    { month: 'Nov', rate: 87 }, { month: 'Dec', rate: 85 }, { month: 'Jan', rate: 88 },
  ],
};

const predefinedReports = [
  { id: 'headcount', name: 'Headcount Report', description: 'Employee count by department, location and type', icon: Users, tag: 'HR' },
  { id: 'attendance', name: 'Attendance Report', description: 'Monthly attendance analysis and trends', icon: Clock, tag: 'Attendance' },
  { id: 'payroll', name: 'Payroll Summary', description: 'Monthly payroll cost breakdown', icon: DollarSign, tag: 'Payroll' },
  { id: 'leave', name: 'Leave Utilization', description: 'Leave consumption patterns by type and department', icon: BarChart3, tag: 'Leave' },
  { id: 'attrition', name: 'Attrition Report', description: 'Employee turnover and retention metrics', icon: TrendingUp, tag: 'HR' },
  { id: 'recruitment', name: 'Recruitment Metrics', description: 'Hiring funnel, time-to-hire and source effectiveness', icon: Users, tag: 'Recruitment' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('6m');

  const { data = mockData } = useQuery({
    queryKey: ['reports-data', period],
    queryFn: async () => {
      try { const r = await api.get('/reports/analytics', { params: { period } }); return r.data.data ?? mockData; }
      catch { return mockData; }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Data-driven insights across all HR functions."
        actions={
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Report Library</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Headcount by Dept */}
            <Card>
              <CardHeader><CardTitle className="text-base">Headcount by Department</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.headcountByDept} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} width={75} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Employees" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Attrition Trend */}
            <Card>
              <CardHeader><CardTitle className="text-base">Joining vs Attrition Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.attritionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} name="Joined" />
                    <Bar dataKey="left" fill="#ef4444" radius={[4, 4, 0, 0]} name="Left" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payroll Trend */}
            <Card>
              <CardHeader><CardTitle className="text-base">Payroll Cost Trend (₹L)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.payrollTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `₹${v}L`} />
                    <Line type="monotone" dataKey="gross" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Gross" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leave by Type */}
            <Card>
              <CardHeader><CardTitle className="text-base">Leave Distribution by Type</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={data.leaveByType} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                        {data.leaveByType.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {data.leaveByType.map((s: { name: string; value: number }, i: number) => (
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
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predefinedReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow group cursor-pointer">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{report.name}</h3>
                          <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{report.tag}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="h-3.5 w-3.5 mr-1.5" />Generate Report
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
