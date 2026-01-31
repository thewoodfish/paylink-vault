import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Link2, 
  Calendar, 
  FileText, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { QRCodeCard } from '@/components/ui/QRCodeCard';
import { Identicon } from '@/components/ui/Identicon';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { LightProtocolBadge, LightProtocolInfoCard } from '@/components/ui/LightProtocolBadge';
import { api } from '@/lib/api';
import { getMerchantPubkey } from '@/lib/merchant';
import type { TokenType, ReceiptFieldPolicy } from '@/lib/types';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export default function CreatePayLink() {
  const navigate = useNavigate();
  const merchantPubkey = getMerchantPubkey();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TokenType>('SOL');
  const [customMint, setCustomMint] = useState('');
  const [expiresAt, setExpiresAt] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
  );
  const [invoiceRef, setInvoiceRef] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'standard' | 'enhanced' | 'maximum'>('enhanced');
  const [memoEnabled, setMemoEnabled] = useState(true);
  const [receiptFields, setReceiptFields] = useState<ReceiptFieldPolicy>({
    merchant: true,
    amount: true,
    token: true,
    timeWindow: false,
    invoiceRef: false,
    paylinkId: true,
  });

  const handleFieldToggle = (field: keyof ReceiptFieldPolicy) => {
    setReceiptFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!merchantPubkey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    
    const response = await api.createPayLink({
      amount: parseFloat(amount),
      token,
      tokenMint: token === 'custom' ? customMint : undefined,
      expiresAt: new Date(expiresAt).toISOString(),
      invoiceRef: invoiceRef || undefined,
      privacyLevel,
      memoEnabled,
      receiptFields,
    });

    setLoading(false);

    if (response.error) {
      toast.error(response.error);
    } else if (response.data) {
      setCreatedId(response.data.id);
      setSuccess(true);
      toast.success('PayLink created successfully!');
    }
  };

  const getPayLinkUrl = (id: string) => {
    return `${window.location.origin}/pay/${id}`;
  };

  if (success && createdId) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-success/30">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">PayLink Created!</CardTitle>
            <CardDescription>
              Share this link with your payer to receive payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <QRCodeCard
                value={getPayLinkUrl(createdId)}
                label={getPayLinkUrl(createdId)}
                size={180}
              />
            </div>

            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <a
                  href={getPayLinkUrl(createdId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Pay Page
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button onClick={() => navigate(`/dashboard/paylinks/${createdId}`)}>
                View Details
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setSuccess(false);
                  setCreatedId(null);
                  setAmount('');
                  setInvoiceRef('');
                }}
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              PayLink Details
            </CardTitle>
            <CardDescription>
              Configure your payment link settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount & Token */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.001"
                />
              </div>
              <div className="space-y-2">
                <Label>Token</Label>
                <Select value={token} onValueChange={(v) => setToken(v as TokenType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="custom">Custom Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {token === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="mint">Token Mint Address</Label>
                <Input
                  id="mint"
                  placeholder="Enter SPL token mint address..."
                  value={customMint}
                  onChange={(e) => setCustomMint(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="expiry" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiry Date & Time
              </Label>
              <Input
                id="expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            {/* Invoice Reference */}
            <div className="space-y-2">
              <Label htmlFor="invoice" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoice Reference
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="invoice"
                placeholder="INV-001, Order #123, etc."
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
              />
            </div>

            {/* Privacy Level */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <Label>Privacy Level</Label>
              </div>
              <Select value={privacyLevel} onValueChange={(v) => setPrivacyLevel(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <span>Standard - Light Protocol ZK</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="enhanced">
                    <div className="flex items-center gap-2">
                      <span>Enhanced - Light Protocol ZK Compression</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="maximum">
                    <div className="flex items-center gap-2">
                      <span>Maximum - Full ZK Privacy</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Privacy Level Description */}
              <div className="text-sm text-muted-foreground space-y-1 bg-muted/30 rounded-lg p-3 border border-border/50">
                {privacyLevel === 'standard' && (
                  <>
                    <p className="font-medium text-foreground">Compressed tokens + memo</p>
                    <p>Light Protocol cost savings with PayLink ID matching. Best for easy reconciliation.</p>
                  </>
                )}
                {privacyLevel === 'enhanced' && (
                  <>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      Compressed tokens, no memo
                      <LightProtocolBadge enabled={true} variant="secondary" />
                    </p>
                    <p>Match via amount/recipient only. 99.7% cost savings with enhanced privacy.</p>
                  </>
                )}
                {privacyLevel === 'maximum' && (
                  <>
                    <p className="font-medium text-foreground">Full ZK privacy</p>
                    <p>Maximum ZK privacy with minimal on-chain footprint. Advanced privacy features.</p>
                  </>
                )}
              </div>
            </div>

            {/* Memo Policy */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium">Include Memo</p>
                <p className="text-sm text-muted-foreground">
                  Adds <code className="text-xs bg-muted px-1 rounded">paylink:{'{id}'}</code> to transaction memo
                </p>
              </div>
              <Switch
                checked={memoEnabled}
                onCheckedChange={setMemoEnabled}
              />
            </div>

            {/* Receipt Field Policy */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <Label>Receipt Field Policy</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Select which fields can be included in selective disclosure receipts
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(receiptFields).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={value}
                      onCheckedChange={() => handleFieldToggle(key as keyof ReceiptFieldPolicy)}
                    />
                    <span className="text-sm capitalize">
                      {key === 'timeWindow' ? 'Time Window' : 
                       key === 'invoiceRef' ? 'Invoice Ref' :
                       key === 'paylinkId' ? 'PayLink ID' : key}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading || !amount || !merchantPubkey}
              className="w-full glow-primary"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create PayLink
            </Button>

            {!merchantPubkey && (
              <p className="text-sm text-warning text-center">
                ⚠️ Connect your wallet in the header to create PayLinks
              </p>
            )}
          </CardContent>
        </Card>

        {/* Light Protocol Info Card */}
        <LightProtocolInfoCard className="mt-6" />
      </div>

      {/* Preview */}
      <div className="lg:col-span-2">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>What your payer will see</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border p-4 space-y-4 bg-background">
              {/* Merchant */}
              <div className="flex items-center gap-3">
                <Identicon value={merchantPubkey || 'demo'} size={40} />
                <div>
                  <p className="text-sm text-muted-foreground">Pay to</p>
                  <p className="font-mono text-sm">
                    {merchantPubkey
                      ? `${merchantPubkey.slice(0, 8)}...${merchantPubkey.slice(-4)}`
                      : 'Set merchant key'}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center py-4 border-y border-border">
                <p className="text-3xl font-bold">
                  {amount || '0'} <span className="text-muted-foreground">{token}</span>
                </p>
              </div>

              {/* Privacy badge */}
              <div className="flex justify-center">
                <LightProtocolBadge enabled={true} showDetails={true} />
              </div>

              {/* Cost Savings */}
              <div className="text-center text-xs space-y-1">
                <p className="text-success font-medium">Save 99.7% on rent</p>
                <p className="text-muted-foreground">
                  0.000005 SOL vs 0.002 SOL per account
                </p>
              </div>

              {/* Meta */}
              {invoiceRef && (
                <p className="text-sm text-muted-foreground text-center">
                  Ref: {invoiceRef}
                </p>
              )}

              {/* Privacy Level */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Privacy: <span className="text-primary capitalize">{privacyLevel}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
