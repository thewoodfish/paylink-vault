import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Link2, 
  Plus, 
  ExternalLink, 
  Copy, 
  X,
  Filter,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusPill } from '@/components/ui/StatusPill';
import { CopyButton } from '@/components/ui/CopyButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { api } from '@/lib/api';
import type { PayLink, PayLinkStatus, TokenType } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

export default function PayLinksList() {
  const navigate = useNavigate();
  const [paylinks, setPaylinks] = useState<PayLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PayLinkStatus | 'all'>('all');
  const [tokenFilter, setTokenFilter] = useState<TokenType | 'all'>('all');

  useEffect(() => {
    fetchPayLinks();
  }, [statusFilter, tokenFilter]);

  const fetchPayLinks = async () => {
    setLoading(true);
    setError(null);
    
    const response = await api.getPayLinks({
      status: statusFilter === 'all' ? undefined : statusFilter,
      token: tokenFilter === 'all' ? undefined : tokenFilter,
    });
    
    if (response.error) {
      setError(response.error);
      toast.error(response.error);
    } else if (response.data) {
      setPaylinks(response.data.items);
    }
    
    setLoading(false);
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const response = await api.cancelPayLink(id);
    if (response.error) {
      toast.error('Failed to cancel PayLink');
    } else {
      toast.success('PayLink cancelled');
      fetchPayLinks();
    }
  };

  const shortenId = (id: string) => {
    return id.length > 12 ? `${id.slice(0, 8)}...` : id;
  };

  const getPayLinkUrl = (id: string) => {
    return `${window.location.origin}/pay/${id}`;
  };

  if (loading) {
    return <TableSkeleton rows={6} columns={7} />;
  }

  if (error) {
    return (
      <EmptyState
        icon={Link2}
        title="Failed to load PayLinks"
        description={error}
        action={{ label: 'Try again', onClick: fetchPayLinks }}
      />
    );
  }

  if (paylinks.length === 0 && statusFilter === 'all' && tokenFilter === 'all') {
    return (
      <EmptyState
        icon={Link2}
        title="No PayLinks yet"
        description="Create your first PayLink to start accepting private payments"
        action={{ label: 'Create PayLink', onClick: () => navigate('/dashboard/paylinks/new') }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as PayLinkStatus | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={tokenFilter}
          onValueChange={(v) => setTokenFilter(v as TokenType | 'all')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Token" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tokens</SelectItem>
            <SelectItem value="SOL">SOL</SelectItem>
            <SelectItem value="USDC">USDC</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || tokenFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setTokenFilter('all');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>PayLink ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden lg:table-cell">Expires</TableHead>
              <TableHead className="hidden xl:table-cell">Signature</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paylinks.map((paylink) => (
              <TableRow
                key={paylink.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/dashboard/paylinks/${paylink.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span>{shortenId(paylink.id)}</span>
                    <CopyButton value={paylink.id} />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{paylink.amount}</span>{' '}
                  <span className="text-muted-foreground">{paylink.token}</span>
                </TableCell>
                <TableCell>
                  <StatusPill status={paylink.status} size="sm" />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(paylink.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                  {format(new Date(paylink.expiresAt), 'MMM d, HH:mm')}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {paylink.paidSignature ? (
                    <a
                      href={`https://explorer.solana.com/tx/${paylink.paidSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-mono"
                    >
                      {paylink.paidSignature.slice(0, 8)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CopyButton
                      value={getPayLinkUrl(paylink.id)}
                      variant="ghost"
                      size="icon"
                    />
                    {paylink.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleCancel(paylink.id, e)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {paylinks.length === 0 && (
        <EmptyState
          icon={Filter}
          title="No matching PayLinks"
          description="Try adjusting your filters"
          action={{ label: 'Clear filters', onClick: () => {
            setStatusFilter('all');
            setTokenFilter('all');
          }}}
        />
      )}
    </div>
  );
}
