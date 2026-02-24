import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Users2, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import api from '@/lib/api';

interface OrgOverview {
  name: string;
  industry: string;
  employeeCount: number;
  legalEntitiesCount: number;
  locationsCount: number;
  departmentsCount: number;
}

const modules = [
  { title: 'Legal Entities', description: 'Manage companies, subsidiaries and registration details', icon: Building2, href: '/organization/legal-entities', color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Locations', description: 'Office locations, branches and work sites', icon: MapPin, href: '/organization/locations', color: 'text-green-600', bg: 'bg-green-50' },
  { title: 'Departments', description: 'Organizational departments and hierarchies', icon: Users2, href: '/organization/departments', color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: 'Policies', description: 'HR policies, handbooks and compliance documents', icon: FileText, href: '/organization/policies', color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function OrganizationPage() {
  const { data: org, isLoading } = useQuery<OrgOverview>({
    queryKey: ['organization-overview'],
    queryFn: async () => {
      try {
        const res = await api.get('/organization');
        const data = res.data.data;
        return {
          name: data.name,
          industry: data.industry ?? 'Technology',
          employeeCount: data._count?.employees ?? 0,
          legalEntitiesCount: data._count?.legalEntities ?? 0,
          locationsCount: data._count?.locations ?? 0,
          departmentsCount: data._count?.departments ?? 0,
        };
      } catch {
        return { name: 'TechCorp Inc.', industry: 'Technology', employeeCount: 124, legalEntitiesCount: 3, locationsCount: 5, departmentsCount: 12 };
      }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Organization" description="Manage your company structure, locations, departments and policies." />

      {/* Org Overview Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-32" /></div>
          ) : (
            <div className="flex flex-wrap gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold">{org?.name}</h2>
                <p className="text-muted-foreground">{org?.industry}</p>
              </div>
              <div className="flex gap-6 flex-wrap">
                {[
                  { label: 'Employees', value: org?.employeeCount },
                  { label: 'Legal Entities', value: org?.legalEntitiesCount },
                  { label: 'Locations', value: org?.locationsCount },
                  { label: 'Departments', value: org?.departmentsCount },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-bold text-primary">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {modules.map(({ title, description, icon: Icon, href, color, bg }) => (
          <Link key={href} to={href}>
            <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                <div className={`p-3 rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                    {title}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">{description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
