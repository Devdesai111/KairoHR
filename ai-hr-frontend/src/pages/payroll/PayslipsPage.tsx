import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';

interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string;
  year: number;
  basic: number;
  hra: number;
  special: number;
  gross: number;
  pf: number;
  pt: number;
  tds: number;
  totalDeductions: number;
  net: number;
}

const mockPayslips: Payslip[] = [
  { id: '1', employeeId: 'EMP001', employeeName: 'Priya Sharma', department: 'Engineering', month: 'January', year: 2026, basic: 120000, hra: 48000, special: 32000, gross: 200000, pf: 14400, pt: 200, tds: 15000, totalDeductions: 29600, net: 170400 },
  { id: '2', employeeId: 'EMP002', employeeName: 'Rahul Mehta', department: 'Product', month: 'January', year: 2026, basic: 150000, hra: 60000, special: 40000, gross: 250000, pf: 18000, pt: 200, tds: 25000, totalDeductions: 43200, net: 206800 },
  { id: '3', employeeId: 'EMP004', employeeName: 'Karan Singh', department: 'Sales', month: 'January', year: 2026, basic: 100000, hra: 40000, special: 25000, gross: 165000, pf: 12000, pt: 200, tds: 8000, totalDeductions: 20200, net: 144800 },
  { id: '4', employeeId: 'EMP005', employeeName: 'Neha Gupta', department: 'Finance', month: 'January', year: 2026, basic: 90000, hra: 36000, special: 24000, gross: 150000, pf: 10800, pt: 200, tds: 5000, totalDeductions: 16000, net: 134000 },
  { id: '5', employeeId: 'EMP006', employeeName: 'Amit Kumar', department: 'Engineering', month: 'January', year: 2026, basic: 80000, hra: 32000, special: 18000, gross: 130000, pf: 9600, pt: 200, tds: 3000, totalDeductions: 12800, net: 117200 },
];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function PayslipModal({ payslip, open, onClose }: { payslip: Payslip | null; open: boolean; onClose: () => void }) {
  if (!payslip) return null;
  const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? 'font-semibold text-base border-t pt-3' : ''}`}>
      <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  );
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Payslip — {payslip.month} {payslip.year}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(payslip.employeeName)}</AvatarFallback></Avatar>
            <div>
              <p className="font-semibold">{payslip.employeeName}</p>
              <p className="text-xs text-muted-foreground">{payslip.employeeId} · {payslip.department}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Earnings</p>
            <Row label="Basic Salary" value={fmt(payslip.basic)} />
            <Row label="House Rent Allowance" value={fmt(payslip.hra)} />
            <Row label="Special Allowance" value={fmt(payslip.special)} />
            <Row label="Gross Salary" value={fmt(payslip.gross)} bold />
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Deductions</p>
            <Row label="Provident Fund (12%)" value={fmt(payslip.pf)} />
            <Row label="Professional Tax" value={fmt(payslip.pt)} />
            <Row label="TDS (Income Tax)" value={fmt(payslip.tds)} />
            <Row label="Total Deductions" value={fmt(payslip.totalDeductions)} bold />
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold text-primary">
            <span>Net Salary</span>
            <span>{fmt(payslip.net)}</span>
          </div>
          <Button className="w-full" variant="outline"><Download className="h-4 w-4 mr-2" />Download PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PayslipsPage() {
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('January');
  const [year] = useState(2026);
  const [viewing, setViewing] = useState<Payslip | null>(null);

  const { data: payslips = [] } = useQuery<Payslip[]>({
    queryKey: ['payslips', month, year],
    queryFn: async () => {
      try { const r = await api.get('/payroll/payslips', { params: { month, year } }); return r.data.data?.data ?? []; }
      catch { return mockPayslips; }
    },
  });

  const filtered = payslips.filter(p =>
    !search || p.employeeName.toLowerCase().includes(search.toLowerCase()) || p.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Payslips" description="View and download employee payslips." />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export All</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ps) => (
          <Card key={ps.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="font-semibold bg-primary/10 text-primary">{getInitials(ps.employeeName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{ps.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{ps.employeeId} · {ps.department}</p>
                  <p className="text-xs text-muted-foreground">{ps.month} {ps.year}</p>
                </div>
                <Badge variant="success" className="text-xs">Paid</Badge>
              </div>
              <div className="mt-3 p-2.5 rounded-lg bg-muted/40 grid grid-cols-2 gap-1 text-xs">
                <span className="text-muted-foreground">Gross</span>
                <span className="font-medium text-right">₹{(ps.gross / 1000).toFixed(0)}K</span>
                <span className="text-muted-foreground">Deductions</span>
                <span className="font-medium text-right text-destructive">-₹{(ps.totalDeductions / 1000).toFixed(0)}K</span>
                <span className="font-semibold text-foreground">Net Pay</span>
                <span className="font-bold text-right text-primary">₹{(ps.net / 1000).toFixed(0)}K</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setViewing(ps)}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />View
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1.5" />Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No payslips found.</p>
        </div>
      )}

      <PayslipModal payslip={viewing} open={!!viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
