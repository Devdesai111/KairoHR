import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  color: string;
}

const mockEvents: CalendarEvent[] = [
  { id: '1', employeeName: 'Priya Sharma', leaveType: 'Annual', startDate: '2026-02-25', endDate: '2026-02-26', color: '#3b82f6' },
  { id: '2', employeeName: 'Amit Kumar', leaveType: 'Annual', startDate: '2026-02-20', endDate: '2026-02-22', color: '#3b82f6' },
  { id: '3', employeeName: 'Neha Gupta', leaveType: 'Sick', startDate: '2026-02-15', endDate: '2026-02-16', color: '#ef4444' },
  { id: '4', employeeName: 'Karan Singh', leaveType: 'Casual', startDate: '2026-02-10', endDate: '2026-02-10', color: '#10b981' },
  { id: '5', employeeName: 'Anjali Patel', leaveType: 'Casual', startDate: '2026-02-28', endDate: '2026-03-02', color: '#10b981' },
];

const holidays = [
  { date: '2026-03-25', name: 'Holi' },
  { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti' },
  { date: '2026-05-01', name: 'Maharashtra Day' },
];

export default function LeaveCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: events = mockEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['leave-calendar', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      try {
        const r = await api.get('/leave/calendar', { params: { month: format(currentMonth, 'yyyy-MM') } });
        return r.data.data ?? mockEvents;
      } catch { return mockEvents; }
    },
  });

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = startOfMonth(currentMonth).getDay();

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => {
      const start = parseISO(e.startDate);
      const end = parseISO(e.endDate);
      return date >= start && date <= end;
    });
  };

  const getHolidayForDay = (date: Date) => holidays.find(h => h.date === format(date, 'yyyy-MM-dd'));

  const selectedDayEvents = selectedDay ? events.filter(e => {
    const d = parseISO(selectedDay);
    return d >= parseISO(e.startDate) && d <= parseISO(e.endDate);
  }) : [];

  const selectedDayHoliday = selectedDay ? holidays.find(h => h.date === selectedDay) : null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Leave Calendar" description="Visual overview of team leaves and holidays." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                {days.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = getEventsForDay(day);
                  const holiday = getHolidayForDay(day);
                  const isWeekend = isSaturday(day) || isSunday(day);
                  const isSelected = dayStr === selectedDay;
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedDay(dayStr === selectedDay ? null : dayStr)}
                      className={`min-h-16 p-1 rounded-lg cursor-pointer border transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border hover:bg-muted/30'} ${isWeekend ? 'bg-muted/20' : ''}`}
                    >
                      <div className={`text-xs font-medium mb-1 w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'bg-primary text-white' : isWeekend ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                      {holiday && <div className="text-[9px] bg-purple-100 text-purple-700 rounded px-1 mb-0.5 truncate">{holiday.name}</div>}
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} className="text-[9px] rounded px-1 mb-0.5 truncate text-white" style={{ backgroundColor: e.color }}>
                          {getInitials(e.employeeName)}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayEvents.length - 2} more</div>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { color: '#3b82f6', label: 'Annual Leave' },
                { color: '#ef4444', label: 'Sick Leave' },
                { color: '#10b981', label: 'Casual Leave' },
                { color: '#f59e0b', label: 'Comp Off' },
                { color: '#8b5cf6', label: 'Maternity/Paternity' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded bg-purple-100" />
                <span className="text-muted-foreground">Holiday</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected day details */}
          {selectedDay && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{format(parseISO(selectedDay), 'MMMM d, yyyy')}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayHoliday && (
                  <div className="mb-3 p-2 rounded bg-purple-50 text-purple-700 text-sm">🎉 {selectedDayHoliday.name}</div>
                )}
                {selectedDayEvents.length === 0 && !selectedDayHoliday ? (
                  <p className="text-sm text-muted-foreground">No leaves on this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map(e => (
                      <div key={e.id} className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(e.employeeName)}</AvatarFallback></Avatar>
                        <div>
                          <p className="text-xs font-medium">{e.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{e.leaveType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Holidays */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Upcoming Holidays</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {holidays.map(h => (
                <div key={h.date} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{h.name}</span>
                  <span className="font-medium">{format(parseISO(h.date), 'MMM d')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
