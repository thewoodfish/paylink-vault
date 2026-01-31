import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Receipt, ExternalLink, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { getMerchantPubkey } from '@/lib/merchant';
import { mockReceipts, isDemoMode } from '@/lib/mockData';
import type { Receipt as ReceiptType } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function ReceiptsList() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);

    // Demo mode: use mock receipts
    if (isDemoMode()) {
      setTimeout(() => {
        setReceipts(mockReceipts);
        setLoading(false);
      }, 500); // Simulate API delay
      return;
    }

    const merchantPubkey = getMerchantPubkey();
    const response = await api.getReceipts({ merchant: merchantPubkey });

    if (response.error) {
      setError(response.error);
      toast.error(response.error);
    } else if (response.data) {
      setReceipts(response.data.items);
    }

    setLoading(false);
  };

  const shortenHash = (hash: string) => {
    return hash.length > 16 ? `${hash.slice(0, 12)}...${hash.slice(-4)}` : hash;
  };

  if (loading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  if (error) {
    return (
      <EmptyState
        icon={Receipt}
        title="Failed to load receipts"
        description={error}
        action={{ label: 'Try again', onClick: fetchReceipts }}
      />
    );
  }

  if (receipts.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No receipts yet"
        description="Receipts will appear here once your PayLinks are paid"
        action={{ label: 'Create PayLink', onClick: () => navigate('/dashboard/paylinks/new') }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Commitment Hash</TableHead>
              <TableHead>PayLink</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Issued</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow
                key={receipt.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/receipt/${receipt.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span>{shortenHash(receipt.commitmentHash)}</span>
                    <CopyButton value={receipt.commitmentHash} />
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    to={`/dashboard/paylinks/${receipt.paylinkId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline font-mono text-sm"
                  >
                    {receipt.paylinkId.slice(0, 8)}...
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusPill status={receipt.status} size="sm" />
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(receipt.issuedAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CopyButton value={receipt.commitmentHash} variant="ghost" size="icon" />
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to="/verify">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
