import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Video, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';

const mockEvents = [
  { id: '1', title: 'Sprint Planning', date: '2026-02-24', time: '10:00', type: 'TEAM', link: true },
  { id: '2', title: '1:1 Priya', date: '2026-02-24', time: '14:00', type: 'ONE_ON_ONE', location: true },
  { id: '3', title: 'All Hands', date: '2026-02-28', time: '16:00', type: 'ALL_HANDS', link: true },
  { id: '4', title: 'Interview - Arjun', date: '2026-02-26', time: '11:00', type: 'INTERVIEW', link: true },
  { id: '5', title: 'Perf Review - Neha', date: '2026-02-27', time: '15:00', type: 'PERFORMANCE_REVIEW', location: true },
];

const typeColors: Record<string, string> = {
  ONE_ON_ONE: 'bg-blue-500', TEAM: 'bg-green-500', ALL_HANDS: 'bg-purple-500',
  INTERVIEW: 'bg-orange-500', PERFORMANCE_REVIEW: 'bg-red-500',
};

export default function MeetingCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = startOfMonth(currentMonth).getDay();

  const selectedEvents = selectedDate ? mockEvents.filter(e => e.date === selectedDate) : [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Meeting Calendar" description="View all meetings on a calendar." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-0.5 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
                {days.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = mockEvents.filter(e => e.date === dayStr);
                  const isWeekend = isSaturday(day) || isSunday(day);
                  const isSelected = dayStr === selectedDate;
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedDate(dayStr)}
                      className={`min-h-14 p-1 rounded-lg cursor-pointer border transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border hover:bg-muted/30'} ${isWeekend ? 'bg-muted/20' : ''}`}
                    >
                      <div className={`text-xs w-6 h-6 rounded-full flex items-center justify-center mb-1 font-medium ${isToday ? 'bg-primary text-white' : isWeekend ? 'text-muted-foreground' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} className={`text-[10px] text-white rounded px-1 mb-0.5 truncate ${typeColors[e.type] ?? 'bg-gray-500'}`}>
                          {e.time} {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</div>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Events */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{selectedDate ? format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d') : 'Select a day'}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(e => (
                    <div key={e.id} className="flex gap-3">
                      <div className={`w-1 rounded-full ${typeColors[e.type] ?? 'bg-gray-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.time}</p>
                        {e.link && <div className="flex items-center gap-1 text-xs text-primary mt-0.5"><Video className="h-3 w-3" />Video call</div>}
                        {e.location && <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><MapPin className="h-3 w-3" />In-person</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Meeting Types</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { type: 'ONE_ON_ONE', label: '1:1 Meeting' }, { type: 'TEAM', label: 'Team Meeting' },
                { type: 'ALL_HANDS', label: 'All Hands' }, { type: 'INTERVIEW', label: 'Interview' },
                { type: 'PERFORMANCE_REVIEW', label: 'Performance Review' },
              ].map(({ type, label }) => (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div className={`h-3 w-3 rounded ${typeColors[type]}`} />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
