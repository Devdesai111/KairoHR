import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSunday, isSaturday } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';

interface AttendanceRecord {
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  checkIn?: string;
  checkOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'WEEKEND';
  workHours?: number;
}

const mockRecords: AttendanceRecord[] = [
  { date: '2026-02-24', employeeId: 'EMP001', employeeName: 'Priya Sharma', department: 'Engineering', checkIn: '09:02', checkOut: '18:15', status: 'PRESENT', workHours: 9.2 },
  { date: '2026-02-24', employeeId: 'EMP002', employeeName: 'Rahul Mehta', department: 'Product', checkIn: '09:45', checkOut: '18:00', status: 'LATE', workHours: 8.25 },
  { date: '2026-02-24', employeeId: 'EMP003', employeeName: 'Anjali Patel', department: 'Design', status: 'ABSENT' },
  { date: '2026-02-24', employeeId: 'EMP004', employeeName: 'Karan Singh', department: 'Sales', checkIn: '08:55', checkOut: '18:10', status: 'PRESENT', workHours: 9.25 },
  { date: '2026-02-24', employeeId: 'EMP005', employeeName: 'Neha Gupta', department: 'Finance', checkIn: '09:00', checkOut: '13:00', status: 'HALF_DAY', workHours: 4 },
  { date: '2026-02-24', employeeId: 'EMP006', employeeName: 'Amit Kumar', department: 'Engineering', checkIn: '09:05', checkOut: '18:30', status: 'PRESENT', workHours: 9.4 },
  { date: '2026-02-24', employeeId: 'EMP007', employeeName: 'Sneha Joshi', department: 'HR', checkIn: '08:50', checkOut: '17:55', status: 'PRESENT', workHours: 9.1 },
];

const statusConfig = {
  PRESENT: { label: 'Present', variant: 'success' as const, icon: CheckCircle2, color: 'text-green-600' },
  ABSENT: { label: 'Absent', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
  LATE: { label: 'Late', variant: 'warning' as const, icon: AlertCircle, color: 'text-yellow-600' },
  HALF_DAY: { label: 'Half Day', variant: 'secondary' as const, icon: Clock, color: 'text-orange-600' },
  HOLIDAY: { label: 'Holiday', variant: 'info' as const, icon: CheckCircle2, color: 'text-blue-600' },
  WEEKEND: { label: 'Weekend', variant: 'secondary' as const, icon: CheckCircle2, color: 'text-gray-400' },
};

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dept, setDept] = useState('ALL');

  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', selectedDate, dept],
    queryFn: async () => {
      try {
        const res = await api.get('/attendance', { params: { date: selectedDate, department: dept !== 'ALL' ? dept : undefined } });
        return res.data.data ?? [];
      } catch { return mockRecords; }
    },
  });

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const stats = {
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    halfDay: records.filter(r => r.status === 'HALF_DAY').length,
  };

  const depts = [...new Set(mockRecords.map(r => r.department))];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Attendance"
        description={`Daily attendance for ${format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm" asChild><a href="/attendance/regularization">Regularize</a></Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="py-1 text-muted-foreground font-medium">{d}</div>
              ))}
              {/* Padding for first week */}
              {Array.from({ length: monthDays[0].getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
              {monthDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isWeekend = isSaturday(day) || isSunday(day);
                const isSelected = dayStr === selectedDate;
                const isTd = isToday(day);
                return (
                  <button
                    key={dayStr}
                    onClick={() => !isWeekend && setSelectedDate(dayStr)}
                    disabled={isWeekend}
                    className={`rounded-md py-1.5 text-xs transition-colors ${isWeekend ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'} ${isSelected ? 'bg-primary text-white hover:bg-primary' : ''} ${isTd && !isSelected ? 'ring-1 ring-primary font-bold' : ''}`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Present', count: stats.present, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Absent', count: stats.absent, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Late', count: stats.late, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Half Day', count: stats.halfDay, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`rounded-xl ${bg} p-3 text-center`}>
                <div className={`text-2xl font-bold ${color}`}>{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-3">
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {depts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Records */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="divide-y">
                  {records.map((rec) => {
                    const cfg = statusConfig[rec.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={rec.employeeId} className="flex items-center gap-3 px-4 py-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(rec.employeeName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none">{rec.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{rec.department} · {rec.employeeId}</p>
                        </div>
                        <div className="text-right text-xs">
                          {rec.checkIn && <p className="text-muted-foreground">In: <span className="font-medium text-foreground">{rec.checkIn}</span></p>}
                          {rec.checkOut && <p className="text-muted-foreground">Out: <span className="font-medium text-foreground">{rec.checkOut}</span></p>}
                          {rec.workHours && <p className="text-xs text-muted-foreground">{rec.workHours}h</p>}
                        </div>
                        <Badge variant={cfg.variant} className="text-xs w-20 justify-center">
                          <Icon className="h-3 w-3 mr-1" />{cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
