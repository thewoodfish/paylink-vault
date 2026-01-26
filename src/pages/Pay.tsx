import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Receipt,
  ArrowRight,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Identicon } from '@/components/ui/Identicon';
import { StatusPill } from '@/components/ui/StatusPill';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { HeliusBadge } from '@/components/ui/HeliusBadge';
import { DetailsSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import type { PayLink, FeeEstimate } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

type PaymentStep = 'confirm' | 'fees' | 'processing' | 'done';

export default function Pay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [paylink, setPaylink] = useState<PayLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<PaymentStep>('confirm');
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [selectedFee, setSelectedFee] = useState<'low' | 'medium' | 'high'>('medium');
  const [loadingFees, setLoadingFees] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPayLink();
    }
  }, [id]);

  const fetchPayLink = async () => {
    setLoading(true);
    const response = await api.getPayLink(id!);
    
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setPaylink(response.data);
      if (response.data.status === 'paid') {
        setPaid(true);
      }
    }
    
    setLoading(false);
  };

  const fetchFeeEstimate = async () => {
    setLoadingFees(true);
    const response = await api.getPriorityFeeEstimate();
    if (response.data) {
      setFeeEstimate(response.data);
    }
    setLoadingFees(false);
  };

  const handleStartPayment = () => {
    setDialogOpen(true);
    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('fees');
    fetchFeeEstimate();
  };

  const handleSubmitPayment = async () => {
    setStep('processing');
    setProcessing(true);
    
    const response = await api.simulatePayment(id!);
    
    if (response.error) {
      toast.error('Payment failed');
      setDialogOpen(false);
      setProcessing(false);
    } else {
      setStep('done');
      setPaid(true);
      setProcessing(false);
      toast.success('Payment successful!');
    }
  };

  const getExpiryStatus = () => {
    if (!paylink) return null;
    const now = new Date();
    const expiry = new Date(paylink.expiresAt);
    const diff = differenceInSeconds(expiry, now);
    
    if (diff <= 0) return { expired: true, text: 'Expired' };
    if (diff < 3600) return { expired: false, text: `${Math.floor(diff / 60)}m remaining` };
    return { expired: false, text: formatDistanceToNow(expiry, { addSuffix: true }) };
  };

  const formatLamports = (lamports: number) => {
    return `${(lamports / 1e9).toFixed(6)} SOL`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <DetailsSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paylink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <EmptyState
              icon={AlertCircle}
              title="PayLink not found"
              description={error || 'This payment link does not exist or has been removed'}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiryStatus = getExpiryStatus();
  const isExpired = expiryStatus?.expired || paylink.status === 'expired';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Shield className="h-4 w-4" />
            Secure Payment
          </div>
          <h1 className="text-xl font-semibold gradient-text">Receiptless PayLink</h1>
        </div>

        {/* Payment Card */}
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-6">
            {/* Merchant */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <Identicon value={paylink.merchantPubkey} size={48} />
              <div>
                <p className="text-sm text-muted-foreground">Pay to</p>
                <p className="font-mono text-sm">
                  {paylink.merchantPubkey.slice(0, 12)}...{paylink.merchantPubkey.slice(-6)}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center py-6 border-y border-border">
              <p className="text-4xl font-bold mb-2">
                {paylink.amount}
                <span className="text-2xl text-muted-foreground ml-2">{paylink.token}</span>
              </p>
              {paylink.invoiceRef && (
                <p className="text-sm text-muted-foreground">
                  Ref: {paylink.invoiceRef}
                </p>
              )}
            </div>

            {/* Status / Expiry */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                  {expiryStatus?.text}
                </span>
              </div>
              {paid ? (
                <StatusPill status="paid" />
              ) : isExpired ? (
                <StatusPill status="expired" />
              ) : (
                <PrivacyBadge level="selective" />
              )}
            </div>

            {/* Privacy notice */}
            {!paid && !isExpired && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                <p className="font-medium text-primary mb-1">🔒 Privacy Protected</p>
                <p className="text-muted-foreground text-xs">
                  Payment details are minimally exposed on-chain. You'll receive a receipt 
                  with selective disclosure controls.
                </p>
              </div>
            )}

            {/* CTA */}
            {paid ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">Payment Complete</p>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate(`/receipt/demo-${id}`)}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Get Receipt
                </Button>
              </div>
            ) : isExpired ? (
              <Button className="w-full" disabled>
                PayLink Expired
              </Button>
            ) : (
              <Button 
                className="w-full glow-primary" 
                size="lg"
                onClick={handleStartPayment}
              >
                Pay Privately
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Helius badge */}
            <div className="flex justify-center">
              <HeliusBadge feature="priority-fees" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            {step === 'confirm' && (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm Payment</DialogTitle>
                  <DialogDescription>
                    Review the payment details before proceeding
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{paylink.amount} {paylink.token}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-mono text-sm">{paylink.merchantPubkey.slice(0, 12)}...</span>
                  </div>
                  {paylink.invoiceRef && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Reference</span>
                      <span>{paylink.invoiceRef}</span>
                    </div>
                  )}
                  <Button className="w-full" onClick={handleConfirm}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 'fees' && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Priority Fee
                  </DialogTitle>
                  <DialogDescription>
                    Select transaction priority for faster confirmation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {loadingFees ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : feeEstimate ? (
                    <RadioGroup value={selectedFee} onValueChange={(v) => setSelectedFee(v as any)}>
                      <div className="space-y-2">
                        <Label
                          htmlFor="low"
                          className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="low" id="low" />
                            <div>
                              <p className="font-medium">Low</p>
                              <p className="text-xs text-muted-foreground">~30 seconds</p>
                            </div>
                          </div>
                          <span className="text-sm font-mono">{formatLamports(feeEstimate.low)}</span>
                        </Label>
                        <Label
                          htmlFor="medium"
                          className="flex items-center justify-between p-4 rounded-lg border border-primary/50 bg-primary/5 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="medium" id="medium" />
                            <div>
                              <p className="font-medium">Medium</p>
                              <p className="text-xs text-muted-foreground">~10 seconds</p>
                            </div>
                          </div>
                          <span className="text-sm font-mono">{formatLamports(feeEstimate.medium)}</span>
                        </Label>
                        <Label
                          htmlFor="high"
                          className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="high" id="high" />
                            <div>
                              <p className="font-medium">High</p>
                              <p className="text-xs text-muted-foreground">~5 seconds</p>
                            </div>
                          </div>
                          <span className="text-sm font-mono">{formatLamports(feeEstimate.high)}</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  ) : (
                    <p className="text-center text-muted-foreground">Failed to load fee estimates</p>
                  )}
                  <Button className="w-full" onClick={handleSubmitPayment} disabled={!feeEstimate}>
                    Submit Transaction
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 'processing' && (
              <>
                <DialogHeader>
                  <DialogTitle>Processing Payment</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Submitting transaction to Solana...</p>
                  <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
                </div>
              </>
            )}

            {step === 'done' && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center">Payment Complete!</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Your payment has been confirmed on-chain
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => {
                      setDialogOpen(false);
                      navigate(`/receipt/demo-${id}`);
                    }}>
                      <Receipt className="mr-2 h-4 w-4" />
                      Get Receipt
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
