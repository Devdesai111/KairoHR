import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, CalendarDays, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  color: string;
  totalEntitled: number;
  used: number;
  pending: number;
  available: number;
  carryForward: number;
}

interface LeaveHistory {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  reason: string;
}

const mockBalances: LeaveBalance[] = [
  { leaveTypeId: '1', leaveTypeName: 'Annual Leave', color: '#3b82f6', totalEntitled: 21, used: 5, pending: 2, available: 14, carryForward: 3 },
  { leaveTypeId: '2', leaveTypeName: 'Sick Leave', color: '#ef4444', totalEntitled: 12, used: 2, pending: 0, available: 10, carryForward: 0 },
  { leaveTypeId: '3', leaveTypeName: 'Casual Leave', color: '#10b981', totalEntitled: 10, used: 3, pending: 0, available: 7, carryForward: 0 },
  { leaveTypeId: '4', leaveTypeName: 'Maternity Leave', color: '#8b5cf6', totalEntitled: 182, used: 0, pending: 0, available: 182, carryForward: 0 },
  { leaveTypeId: '5', leaveTypeName: 'Comp Off', color: '#f59e0b', totalEntitled: 4, used: 1, pending: 0, available: 3, carryForward: 0 },
];

const mockHistory: LeaveHistory[] = [
  { id: '1', leaveType: 'Annual Leave', startDate: '2026-01-15', endDate: '2026-01-17', days: 3, status: 'APPROVED', reason: 'Family vacation' },
  { id: '2', leaveType: 'Sick Leave', startDate: '2026-02-03', endDate: '2026-02-04', days: 2, status: 'APPROVED', reason: 'Fever and cold' },
  { id: '3', leaveType: 'Annual Leave', startDate: '2026-02-25', endDate: '2026-02-26', days: 2, status: 'PENDING', reason: 'Personal work' },
  { id: '4', leaveType: 'Casual Leave', startDate: '2026-01-08', endDate: '2026-01-10', days: 3, status: 'APPROVED', reason: 'Personal work' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'destructive' };

export default function LeaveBalancePage() {
  const { data: balances = [], isLoading: balLoading } = useQuery<LeaveBalance[]>({
    queryKey: ['leave-balance'],
    queryFn: async () => {
      try { const r = await api.get('/leave/balance'); return r.data.data ?? []; }
      catch { return mockBalances; }
    },
  });

  const { data: history = [], isLoading: histLoading } = useQuery<LeaveHistory[]>({
    queryKey: ['leave-history'],
    queryFn: async () => {
      try { const r = await api.get('/leave/applications/my'); return r.data.data?.data ?? []; }
      catch { return mockHistory; }
    },
  });

  const totalUsed = balances.reduce((s, b) => s + b.used, 0);
  const totalAvailable = balances.filter(b => b.leaveTypeName !== 'Maternity Leave').reduce((s, b) => s + b.available, 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Leave"
        description="View your leave balances and apply for leave."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/leave/calendar">Calendar View</Link></Button>
            <Button asChild><Link to="/leave/apply"><Plus className="h-4 w-4 mr-2" />Apply Leave</Link></Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{totalAvailable}</div>
                <p className="text-sm text-blue-600">Days Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-700">{totalUsed}</div>
                <p className="text-sm text-orange-600">Days Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-700">{balances.reduce((s, b) => s + b.pending, 0)}</div>
                <p className="text-sm text-yellow-600">Days Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Leave Balances</h2>
        {balLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Card key={i}><CardContent className="pt-5 h-28" /></Card>)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((bal) => {
              const usedPct = Math.round((bal.used / bal.totalEntitled) * 100);
              return (
                <Card key={bal.leaveTypeId}>
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{bal.leaveTypeName}</h3>
                        <p className="text-xs text-muted-foreground">{bal.totalEntitled} days total</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: bal.color }}>{bal.available}</div>
                        <p className="text-xs text-muted-foreground">available</p>
                      </div>
                    </div>
                    <Progress value={usedPct} className="h-1.5" />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Used: {bal.used}</span>
                      {bal.pending > 0 && <span>Pending: {bal.pending}</span>}
                      {bal.carryForward > 0 && <span>CF: +{bal.carryForward}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave History */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Recent Applications</h2>
        <Card>
          <CardContent className="p-0">
            {histLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (
              <div className="divide-y">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{h.leaveType}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(h.startDate)} — {formatDate(h.endDate)} · {h.days} day{h.days !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-muted-foreground truncate">{h.reason}</p>
                    </div>
                    <Badge variant={statusVariant[h.status]}>{h.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
