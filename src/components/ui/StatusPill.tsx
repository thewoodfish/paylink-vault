import { cn } from '@/lib/utils';
import type { PayLinkStatus } from '@/lib/types';

interface StatusPillProps {
  status: PayLinkStatus | 'valid' | 'unknown' | 'revoked';
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-warning/20 text-warning border-warning/30',
  },
  paid: {
    label: 'Paid',
    className: 'bg-success/20 text-success border-success/30',
  },
  expired: {
    label: 'Expired',
    className: 'bg-muted text-muted-foreground border-border',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  valid: {
    label: 'Valid',
    className: 'bg-success/20 text-success border-success/30',
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-muted text-muted-foreground border-border',
  },
  revoked: {
    label: 'Revoked',
    className: 'bg-destructive/20 text-destructive border-destructive/30',
  },
};

export function StatusPill({ status, size = 'md', className }: StatusPillProps) {
  const config = statusConfig[status] || statusConfig.unknown;
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className,
        className
      )}
    >
      <span className={cn(
        'mr-1.5 h-1.5 w-1.5 rounded-full',
        status === 'pending' && 'bg-warning animate-pulse',
        status === 'paid' && 'bg-success',
        status === 'valid' && 'bg-success',
        (status === 'expired' || status === 'unknown') && 'bg-muted-foreground',
        (status === 'cancelled' || status === 'revoked') && 'bg-destructive'
      )} />
      {config.label}
    </span>
  );
}
