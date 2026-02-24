import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Shield, Pencil, Trash2, Loader2, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const mockUsers: SystemUser[] = [
  { id: '1', name: 'Arjun Malhotra', email: 'admin@techcorp.com', role: 'SUPER_ADMIN', isActive: true, lastLogin: '2026-02-24', createdAt: '2024-01-01' },
  { id: '2', name: 'Sneha Joshi', email: 'sneha@techcorp.com', role: 'HR_ADMIN', isActive: true, lastLogin: '2026-02-23', createdAt: '2024-03-01' },
  { id: '3', name: 'Vikram Nair', email: 'vikram@techcorp.com', role: 'MANAGER', isActive: true, lastLogin: '2026-02-22', createdAt: '2024-03-15' },
  { id: '4', name: 'Priya Sharma', email: 'priya@techcorp.com', role: 'EMPLOYEE', isActive: true, lastLogin: '2026-02-24', createdAt: '2024-04-01' },
  { id: '5', name: 'Old Admin', email: 'oldadmin@techcorp.com', role: 'HR_ADMIN', isActive: false, lastLogin: '2025-10-01', createdAt: '2023-01-01' },
];

const roleColors: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  SUPER_ADMIN: 'default', HR_ADMIN: 'success', MANAGER: 'warning', EMPLOYEE: 'secondary',
};

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(1),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users = [] } = useQuery<SystemUser[]>({
    queryKey: ['system-users'],
    queryFn: async () => {
      try { const r = await api.get('/users'); return r.data.data?.data ?? []; }
      catch { return mockUsers; }
    },
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', role: 'EMPLOYEE', isActive: true } });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) await api.patch(`/users/${editing.id}`, data);
      else await api.post('/users/invite', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-users'] }); toast({ title: editing ? 'User updated' : 'User invited!' }); setOpen(false); },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-users'] }),
  });

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u: SystemUser) => {
    setEditing(u);
    form.reset({ name: u.name, email: u.email, role: u.role, isActive: u.isActive });
    setOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles and access control."
        actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Invite User</Button>}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Users', count: users.length },
          { label: 'Active', count: users.filter(u => u.isActive).length },
          { label: 'Admins', count: users.filter(u => u.role.includes('ADMIN')).length },
          { label: 'Managers', count: users.filter(u => u.role === 'MANAGER').length },
        ].map(({ label, count }) => (
          <Card key={label}><CardContent className="pt-5"><div className="text-2xl font-bold text-primary">{count}</div><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filtered.map((user) => (
          <Card key={user.id} className={`${!user.isActive ? 'opacity-60' : ''} group`}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="font-semibold bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{user.name}</p>
                    <Badge variant={roleColors[user.role] ?? 'secondary'} className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />{user.role.replace('_', ' ')}
                    </Badge>
                    {!user.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.lastLogin && <p className="text-xs text-muted-foreground">Last login: {user.lastLogin}</p>}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Switch
                    checked={user.isActive}
                    onCheckedChange={(v) => toggleActive.mutate({ id: user.id, isActive: v })}
                    title={user.isActive ? 'Deactivate' : 'Activate'}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(user)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(user.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit User' : 'Invite User'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled={!!editing} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              {editing && (
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Active Account</FormLabel>
                  </FormItem>
                )} />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Update' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
