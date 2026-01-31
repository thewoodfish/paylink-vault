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
import { mockReceipts, isDemoMode } from '@/lib/mockData';
import type { Receipt, ReceiptFieldPolicy } from '@/lib/types';
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

    // Check if demo mode and use mock data
    if (isDemoMode()) {
      const mockReceipt = mockReceipts.find(r => r.id === id);
      if (mockReceipt) {
        setReceipt(mockReceipt);
        setDisclosedFields(mockReceipt.disclosedFields);
        setLoading(false);
        return;
      }
    }

    // Try real API
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

  const generateProof = async () => {
    if (!receipt) return;

    // Demo mode: generate mock proof
    if (isDemoMode()) {
      const revealedFields: any = {};

      if (disclosedFields.merchant && receipt.proofData?.merchant) {
        revealedFields.merchantPubkey = receipt.proofData.merchant;
      }
      if (disclosedFields.amount && receipt.proofData?.amount) {
        revealedFields.amount = receipt.proofData.amount;
      }
      if (disclosedFields.token && receipt.proofData?.token) {
        revealedFields.mint = receipt.proofData.token;
      }
      if (disclosedFields.timeWindow && receipt.proofData?.timestamp) {
        revealedFields.timestamp = receipt.proofData.timestamp;
      }
      if (disclosedFields.invoiceRef && receipt.proofData?.invoiceRef) {
        revealedFields.invoiceRef = receipt.proofData.invoiceRef;
      }
      if (disclosedFields.paylinkId) {
        revealedFields.paylinkId = receipt.paylinkId;
      }

      const mockProof = {
        commitment: receipt.commitmentHash,
        nonce: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        revealed: revealedFields,
      };

      setGeneratedProof(JSON.stringify(mockProof, null, 2));
      toast.success('Proof generated!');
      return;
    }

    // Try real API
    const response = await api.getReceiptProof(receipt.id, disclosedFields);
    if (response.error || !response.data) {
      toast.error(response.error || 'Failed to generate proof');
      return;
    }

    setGeneratedProof(JSON.stringify(response.data.proof, null, 2));
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
    const demoReceiptLinks = isDemoMode() ? (
      <div className="mt-6 space-y-2">
        <p className="text-sm font-medium">Try these demo receipts:</p>
        <div className="flex flex-wrap gap-2">
          {mockReceipts.map((mockReceipt) => (
            <Link
              key={mockReceipt.id}
              to={`/receipt/${mockReceipt.id}`}
              className="text-sm text-primary hover:underline"
            >
              {mockReceipt.id}
            </Link>
          ))}
        </div>
      </div>
    ) : null;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <EmptyState
              icon={ReceiptIcon}
              title="Receipt not found"
              description={error || 'This receipt does not exist'}
            />
            {demoReceiptLinks}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Demo Mode Banner */}
        {isDemoMode() && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-warning">ℹ️</div>
                <div>
                  <p className="font-medium text-sm">Demo Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Viewing mock receipt data for demonstration. Connect real wallet and make payments to generate actual receipts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
