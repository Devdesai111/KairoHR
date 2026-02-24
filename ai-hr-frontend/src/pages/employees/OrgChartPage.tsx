import { useQuery } from '@tanstack/react-query';
import { Users2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';

interface OrgNode {
  id: string;
  name: string;
  designation: string;
  department: string;
  avatar?: string;
  reports?: OrgNode[];
}

const mockOrgTree: OrgNode = {
  id: 'ceo', name: 'Arjun Malhotra', designation: 'CEO & Founder', department: 'Executive',
  reports: [
    {
      id: 'cto', name: 'Ravi Krishnan', designation: 'CTO', department: 'Technology',
      reports: [
        { id: 'eng-mgr', name: 'Vikram Nair', designation: 'Engineering Manager', department: 'Engineering',
          reports: [
            { id: 'se1', name: 'Priya Sharma', designation: 'Senior Engineer', department: 'Engineering', reports: [] },
            { id: 'se2', name: 'Amit Kumar', designation: 'Backend Developer', department: 'Engineering', reports: [] },
            { id: 'se3', name: 'Anjali Patel', designation: 'UI/UX Designer', department: 'Design', reports: [] },
          ]
        },
      ]
    },
    {
      id: 'coo', name: 'Sneha Joshi', designation: 'COO', department: 'Operations',
      reports: [
        { id: 'hr-head', name: 'Meera Iyer', designation: 'HR Head', department: 'Human Resources',
          reports: [
            { id: 'hr-bp', name: 'Kavya Reddy', designation: 'HR Business Partner', department: 'HR', reports: [] },
          ]
        },
        { id: 'fin-head', name: 'Ramesh Shah', designation: 'Finance Head', department: 'Finance',
          reports: [
            { id: 'fa', name: 'Neha Gupta', designation: 'Financial Analyst', department: 'Finance', reports: [] },
          ]
        },
      ]
    },
    {
      id: 'csmo', name: 'Karan Singh', designation: 'Chief Sales & Marketing Officer', department: 'Sales',
      reports: [
        { id: 'mkt', name: 'Rahul Mehta', designation: 'Marketing Lead', department: 'Marketing', reports: [] },
        { id: 'sales', name: 'Pooja Nair', designation: 'Sales Lead', department: 'Sales', reports: [] },
      ]
    },
  ]
};

const deptColors: Record<string, string> = {
  Executive: 'bg-purple-100 text-purple-700',
  Technology: 'bg-blue-100 text-blue-700',
  Engineering: 'bg-indigo-100 text-indigo-700',
  Operations: 'bg-green-100 text-green-700',
  'Human Resources': 'bg-yellow-100 text-yellow-700',
  Finance: 'bg-orange-100 text-orange-700',
  Sales: 'bg-red-100 text-red-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Design: 'bg-teal-100 text-teal-700',
};

function OrgNodeCard({ node, level = 0 }: { node: OrgNode; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasReports = (node.reports?.length ?? 0) > 0;
  const colorClass = deptColors[node.department] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${level > 0 ? 'before:absolute before:-top-4 before:left-1/2 before:w-px before:h-4 before:bg-border' : ''}`}>
        <Card className="w-48 hover:shadow-md transition-shadow cursor-default">
          <CardContent className="pt-4 pb-4 text-center">
            <Avatar className="h-10 w-10 mx-auto mb-2">
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{getInitials(node.name)}</AvatarFallback>
            </Avatar>
            <p className="text-xs font-semibold leading-tight">{node.name}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{node.designation}</p>
            <Badge className={`mt-1.5 text-[10px] ${colorClass}`} variant="outline">{node.department}</Badge>
            {hasReports && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-xs text-primary mx-auto hover:underline"
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {node.reports!.length} report{node.reports!.length !== 1 ? 's' : ''}
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {hasReports && expanded && (
        <div className="mt-0">
          {/* Vertical line down */}
          <div className="w-px h-4 bg-border mx-auto" />
          {/* Horizontal line */}
          {node.reports!.length > 1 && (
            <div className="relative">
              <div className="h-px bg-border" style={{ width: `${(node.reports!.length - 1) * 212}px`, marginLeft: `${-((node.reports!.length - 1) / 2) * 212}px` }} />
            </div>
          )}
          {/* Children */}
          <div className="flex gap-4 mt-0">
            {node.reports!.map((child) => (
              <OrgNodeCard key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { data: orgTree, isLoading } = useQuery<OrgNode>({
    queryKey: ['org-chart'],
    queryFn: async () => {
      try { const res = await api.get('/employees/org-chart'); return res.data.data; }
      catch { return mockOrgTree; }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Organization Chart" description="Visual hierarchy of your organization's reporting structure." />

      {isLoading ? (
        <div className="flex justify-center"><Skeleton className="h-48 w-48" /></div>
      ) : orgTree ? (
        <div className="overflow-auto">
          <div className="min-w-max p-8">
            <div className="flex justify-center items-start">
              <OrgNodeCard node={orgTree} level={0} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Users2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No org chart data available.</p>
        </div>
      )}
    </div>
  );
}
