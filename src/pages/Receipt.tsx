import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Receipt as ReceiptIcon,
  Download,
  ExternalLink,
  Copy,
  CheckCircle,
  Shield,
  EyeOff,
  Eye,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusPill } from '@/components/ui/StatusPill';
import { CopyButton } from '@/components/ui/CopyButton';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { DetailsSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import type { Receipt, ReceiptProof, ReceiptFieldPolicy } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [disclosedFields, setDisclosedFields] = useState<ReceiptFieldPolicy>({
    merchant: true,
    amount: true,
    token: true,
    timeWindow: false,
    invoiceRef: false,
    paylinkId: false,
  });
  const [generatedProof, setGeneratedProof] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const fetchReceipt = async () => {
    setLoading(true);
    const response = await api.getReceipt(id!);
    
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setReceipt(response.data);
      setDisclosedFields(response.data.disclosedFields);
    }
    
    setLoading(false);
  };

  const handleFieldToggle = (field: keyof ReceiptFieldPolicy) => {
    setDisclosedFields((prev) => ({ ...prev, [field]: !prev[field] }));
    setGeneratedProof(null);
  };

  const generateProof = () => {
    if (!receipt) return;

    const proof: ReceiptProof = {
      commitmentHash: receipt.commitmentHash,
      disclosedFields: {
        ...(disclosedFields.merchant && { merchant: receipt.merchantPubkey }),
        ...(disclosedFields.amount && { amount: 10 }), // Mock value
        ...(disclosedFields.token && { token: 'SOL' }),
        ...(disclosedFields.timeWindow && { timeWindow: { start: Date.now() - 3600000, end: Date.now() } }),
        ...(disclosedFields.invoiceRef && { invoiceRef: 'INV-001' }),
        ...(disclosedFields.paylinkId && { paylinkId: receipt.paylinkId }),
      },
      signature: `sig_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };

    setGeneratedProof(JSON.stringify(proof, null, 2));
    toast.success('Proof generated!');
  };

  const downloadProof = () => {
    if (!generatedProof) return;
    
    const blob = new Blob([generatedProof], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-proof-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Proof downloaded');
  };

  const countDisclosed = () => {
    return Object.values(disclosedFields).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <DetailsSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <EmptyState
              icon={ReceiptIcon}
              title="Receipt not found"
              description={error || 'This receipt does not exist'}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Shield className="h-4 w-4" />
            Selective Disclosure Receipt
          </div>
          <h1 className="text-2xl font-bold gradient-text">Payment Receipt</h1>
        </div>

        {/* Receipt Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ReceiptIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Receipt</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {receipt.commitmentHash.slice(0, 24)}...
                  </CardDescription>
                </div>
              </div>
              <StatusPill status={receipt.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Commitment Hash</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm truncate">{receipt.commitmentHash.slice(0, 20)}...</p>
                  <CopyButton value={receipt.commitmentHash} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Issued</p>
                <p className="text-sm">{format(new Date(receipt.issuedAt), 'PPpp')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">PayLink Reference</p>
                <Link
                  to={`/dashboard/paylinks/${receipt.paylinkId}`}
                  className="text-sm text-primary hover:underline font-mono"
                >
                  {receipt.paylinkId}
                </Link>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm capitalize">{receipt.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selective Disclosure */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5" />
                  Selective Disclosure
                </CardTitle>
                <CardDescription>
                  Choose which fields to reveal in your proof
                </CardDescription>
              </div>
              <PrivacyBadge level={countDisclosed() <= 2 ? 'full' : countDisclosed() <= 4 ? 'partial' : 'minimal'} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(disclosedFields).map(([key, value]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    value ? 'border-primary/30 bg-primary/5' : 'border-border'
                  }`}
                >
                  <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                    {value ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="capitalize">
                      {key === 'timeWindow' ? 'Time Window' :
                       key === 'invoiceRef' ? 'Invoice Ref' :
                       key === 'paylinkId' ? 'PayLink ID' : key}
                    </span>
                  </Label>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={() => handleFieldToggle(key as keyof ReceiptFieldPolicy)}
                  />
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-muted/30 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Sharing this proof reveals only the fields you selected.</strong>
                {' '}Hidden fields remain cryptographically protected but still contribute to the verification.
              </p>
            </div>

            <Button onClick={generateProof} className="w-full glow-primary">
              <Share2 className="mr-2 h-4 w-4" />
              Generate Shareable Proof
            </Button>
          </CardContent>
        </Card>

        {/* Generated Proof */}
        {generatedProof && (
          <Card className="border-success/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Generated Proof
                </CardTitle>
                <div className="flex gap-2">
                  <CopyButton value={generatedProof} variant="outline" size="sm" label="Copy JSON" />
                  <Button variant="outline" size="sm" onClick={downloadProof}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={generatedProof}
                readOnly
                className="font-mono text-xs h-48 bg-muted/30"
              />
              <Button asChild className="w-full" variant="outline">
                <Link to={`/verify?proof=${encodeURIComponent(generatedProof)}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Verify Page
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
