import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserCheck, Mail, Phone, Star, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  currentTitle: string;
  currentCompany: string;
  experience: number;
  skills: string[];
  stage: 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  rating?: number;
  appliedFor: string;
  appliedOn: string;
}

const mockCandidates: Candidate[] = [
  { id: '1', name: 'Arjun Kapoor', email: 'arjun.kapoor@gmail.com', phone: '+91 98765 11111', currentTitle: 'Software Engineer', currentCompany: 'Wipro', experience: 5, skills: ['React', 'Node.js', 'PostgreSQL'], stage: 'INTERVIEW', rating: 4, appliedFor: 'Senior Software Engineer', appliedOn: '2026-02-01' },
  { id: '2', name: 'Shreya Mishra', email: 'shreya@outlook.com', phone: '+91 98765 22222', currentTitle: 'Product Analyst', currentCompany: 'Paytm', experience: 6, skills: ['Product Management', 'Agile', 'Data Analysis'], stage: 'SCREENING', rating: 4, appliedFor: 'Product Manager', appliedOn: '2026-02-05' },
  { id: '3', name: 'Vikash Yadav', email: 'vikash.yadav@gmail.com', phone: '+91 98765 33333', currentTitle: 'Full Stack Developer', currentCompany: 'Infosys', experience: 4, skills: ['Vue.js', 'Python', 'AWS'], stage: 'NEW', appliedFor: 'Senior Software Engineer', appliedOn: '2026-02-12' },
  { id: '4', name: 'Kavya Reddy', email: 'kavya.r@gmail.com', phone: '+91 98765 44444', currentTitle: 'UI Designer', currentCompany: 'Freshworks', experience: 3, skills: ['Figma', 'CSS', 'Prototyping'], stage: 'OFFER', rating: 5, appliedFor: 'UI/UX Designer', appliedOn: '2026-01-28' },
  { id: '5', name: 'Rohan Sharma', email: 'rohan.s@gmail.com', phone: '+91 98765 55555', currentTitle: 'Backend Developer', currentCompany: 'Razorpay', experience: 3, skills: ['Java', 'Spring Boot', 'Kafka'], stage: 'HIRED', rating: 5, appliedFor: 'Senior Software Engineer', appliedOn: '2026-01-20' },
  { id: '6', name: 'Neelam Verma', email: 'neelam.v@gmail.com', phone: '+91 98765 66666', currentTitle: 'Data Analyst', currentCompany: 'Swiggy', experience: 2, skills: ['Python', 'SQL', 'Tableau'], stage: 'REJECTED', appliedFor: 'Data Analyst', appliedOn: '2026-02-08' },
];

const stageConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info'; label: string }> = {
  NEW: { variant: 'secondary', label: 'New' },
  SCREENING: { variant: 'warning', label: 'Screening' },
  INTERVIEW: { variant: 'info', label: 'Interview' },
  OFFER: { variant: 'default', label: 'Offer Made' },
  HIRED: { variant: 'success', label: 'Hired' },
  REJECTED: { variant: 'destructive', label: 'Rejected' },
};

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: async () => {
      try { const r = await api.get('/recruitment/candidates'); return r.data.data?.data ?? []; }
      catch { return mockCandidates; }
    },
  });

  const filtered = candidates.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.currentCompany.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'ALL' || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Candidates"
        description={`${candidates.length} total candidates in pipeline`}
      />

      {/* Stage Summary */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(stageConfig).map(([stage, cfg]) => {
          const count = candidates.filter(c => c.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stageFilter === stage ? 'ALL' : stage)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${stageFilter === stage ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/40'}`}
            >
              <span>{cfg.label}</span>
              <span className="bg-white/20 rounded-full px-1.5">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const cfg = stageConfig[c.stage];
          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="font-semibold bg-primary/10 text-primary">{getInitials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{c.name}</h3>
                      {c.rating && (
                        <span className="flex items-center text-xs text-yellow-500">
                          <Star className="h-3 w-3 fill-current mr-0.5" />{c.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.currentTitle} @ {c.currentCompany}</p>
                    <p className="text-xs text-muted-foreground">{c.experience}y experience</p>
                  </div>
                  <Badge variant={cfg.variant} className="text-xs shrink-0">{cfg.label}</Badge>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />Applied {formatDate(c.appliedOn)}</div>
                </div>

                <p className="text-xs text-primary font-medium mb-2">For: {c.appliedFor}</p>

                <div className="flex flex-wrap gap-1">
                  {c.skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">View Profile</Button>
                  <Button size="sm" className="flex-1 h-7 text-xs">Schedule Interview</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Filter className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No candidates match your filters.</p>
        </div>
      )}
    </div>
  );
}
