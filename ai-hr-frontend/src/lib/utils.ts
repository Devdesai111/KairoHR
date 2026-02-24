import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default', APPROVED: 'default', PRESENT: 'default', PAID: 'default', OPEN: 'default',
    PENDING: 'secondary', PROCESSING: 'secondary', COMPUTED: 'secondary', SCHEDULED: 'secondary',
    INACTIVE: 'secondary', REJECTED: 'destructive', CANCELLED: 'destructive', CLOSED: 'secondary',
    LATE: 'secondary', HALF_DAY: 'secondary', ABSENT: 'destructive', DRAFT: 'outline',
    SUSPENDED: 'destructive',
  };
  return map[status] ?? 'secondary';
}

export function monthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleString('en-IN', { month: 'long' });
}
