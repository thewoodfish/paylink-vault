import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Clock,
  ExternalLink,
  Link2,
  Receipt,
  Activity,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusPill } from '@/components/ui/StatusPill';
import { CopyButton } from '@/components/ui/CopyButton';
import { QRCodeCard } from '@/components/ui/QRCodeCard';
import { Identicon } from '@/components/ui/Identicon';
import { HeliusBadge } from '@/components/ui/HeliusBadge';
import { DetailsSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import type { PayLink, ActivityEvent, Receipt as ReceiptType } from '@/lib/types';
import { toast } from 'sonner';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';

export default function PayLinkDetails() {
  const { id } = useParams<{ id: string }>();
  const [paylink, setPaylink] = useState<PayLink | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    
    const [paylinkRes, activityRes, receiptsRes] = await Promise.all([
      api.getPayLink(id!),
      api.getPayLinkActivity(id!),
      api.getPayLinkReceipts(id!),
    ]);

    if (paylinkRes.error) {
      setError(paylinkRes.error);
    } else {
      setPaylink(paylinkRes.data!);
    }

    if (activityRes.data) {
      setActivity(activityRes.data);
    }

    if (receiptsRes.data) {
      setReceipts(receiptsRes.data);
    }

    setLoading(false);
  };

  const getPayLinkUrl = () => {
    return `${window.location.origin}/pay/${id}`;
  };

  const getExpiryStatus = () => {
    if (!paylink) return null;
    const now = new Date();
    const expiry = new Date(paylink.expiresAt);
    const diff = differenceInSeconds(expiry, now);
    
    if (diff <= 0) return { text: 'Expired', color: 'text-destructive' };
    if (diff < 3600) return { text: `${Math.floor(diff / 60)}m remaining`, color: 'text-warning' };
    if (diff < 86400) return { text: `${Math.floor(diff / 3600)}h remaining`, color: 'text-muted-foreground' };
    return { text: formatDistanceToNow(expiry, { addSuffix: true }), color: 'text-muted-foreground' };
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'created': return <Circle className="h-4 w-4 text-primary" />;
      case 'webhook_received': return <Activity className="h-4 w-4 text-[#fe5f00]" />;
      case 'verified': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'receipt_issued': return <Receipt className="h-4 w-4 text-primary" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/paylinks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PayLinks
          </Link>
        </Button>
        <DetailsSkeleton />
      </div>
    );
  }

  if (error || !paylink) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/paylinks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to PayLinks
          </Link>
        </Button>
        <EmptyState
          icon={Link2}
          title="PayLink not found"
          description={error || 'This PayLink does not exist'}
          action={{ label: 'View all PayLinks', onClick: () => {} }}
        />
      </div>
    );
  }

  const expiryStatus = getExpiryStatus();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard/paylinks">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to PayLinks
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Link2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{paylink.amount} {paylink.token}</h2>
              <StatusPill status={paylink.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className={expiryStatus?.color}>{expiryStatus?.text}</span>
            </div>
          </div>
        </div>
        <HeliusBadge feature="webhooks" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="receipts">Receipts ({receipts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Link</CardTitle>
                <CardDescription>Share this link or QR code with your payer</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <QRCodeCard value={getPayLinkUrl()} size={180} />
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">PayLink ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{paylink.id.slice(0, 12)}...</span>
                    <CopyButton value={paylink.id} />
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Merchant</span>
                  <div className="flex items-center gap-2">
                    <Identicon value={paylink.merchantPubkey} size={20} />
                    <span className="font-mono text-sm">
                      {paylink.merchantPubkey.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(paylink.createdAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{format(new Date(paylink.expiresAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
                {paylink.invoiceRef && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Invoice Ref</span>
                    <span>{paylink.invoiceRef}</span>
                  </div>
                )}
                {paylink.paidSignature && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Signature</span>
                    <a
                      href={`https://explorer.solana.com/tx/${paylink.paidSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                    >
                      {paylink.paidSignature.slice(0, 12)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">Created</span>
                </div>
                <div className="flex-1 h-0.5 bg-border" />
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    paylink.status === 'pending' 
                      ? 'bg-warning/20 animate-pulse' 
                      : paylink.status === 'paid'
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}>
                    {paylink.status === 'paid' ? (
                      <CheckCircle className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Clock className={`h-4 w-4 ${
                        paylink.status === 'pending' ? 'text-warning' : 'text-muted-foreground'
                      }`} />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {paylink.status === 'pending' ? 'Awaiting Payment' : 
                     paylink.status === 'paid' ? 'Paid' : 'Expired'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Log</CardTitle>
              <CardDescription>Events related to this PayLink</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-4">
                  {activity.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      {getActivityIcon(event.type)}
                      <div className="flex-1">
                        <p className="font-medium text-sm capitalize">
                          {event.type.replace('_', ' ')}
                        </p>
                        {event.details && (
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issued Receipts</CardTitle>
              <CardDescription>Receipts generated for this PayLink</CardDescription>
            </CardHeader>
            <CardContent>
              {receipts.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No receipts yet"
                  description="Receipts will appear here once the PayLink is paid"
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <Link
                      key={receipt.id}
                      to={`/receipt/${receipt.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-mono text-sm">{receipt.commitmentHash.slice(0, 16)}...</p>
                          <p className="text-xs text-muted-foreground">
                            Issued {formatDistanceToNow(new Date(receipt.issuedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={receipt.status} size="sm" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
