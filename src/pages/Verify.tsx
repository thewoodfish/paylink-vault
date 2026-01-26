import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  FileJson,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import type { ReceiptProof, VerifyResponse } from '@/lib/types';
import { toast } from 'sonner';

const sampleProof: ReceiptProof = {
  commitmentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  disclosedFields: {
    merchant: 'DemoMerchant1234567890abcdef',
    amount: 10,
    token: 'SOL',
  },
  signature: 'sig_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
  timestamp: Date.now(),
};

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [proofJson, setProofJson] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const proofParam = searchParams.get('proof');
    if (proofParam) {
      try {
        const decoded = decodeURIComponent(proofParam);
        setProofJson(decoded);
      } catch {
        // Ignore decode errors
      }
    }
  }, [searchParams]);

  const handleVerify = async () => {
    setParseError(null);
    setResult(null);

    if (!proofJson.trim()) {
      setParseError('Please paste a proof JSON');
      return;
    }

    let proof: ReceiptProof;
    try {
      proof = JSON.parse(proofJson);
    } catch {
      setParseError('Invalid JSON format');
      return;
    }

    if (!proof.commitmentHash || !proof.signature) {
      setParseError('Missing required fields: commitmentHash, signature');
      return;
    }

    setVerifying(true);
    
    const response = await api.verifyReceipt({ proof });
    
    if (response.error) {
      toast.error('Verification failed');
      setResult({
        valid: false,
        verifiedFields: [],
        mismatches: [response.error],
      });
    } else if (response.data) {
      setResult(response.data);
      if (response.data.valid) {
        toast.success('Proof verified successfully!');
      } else {
        toast.error('Proof verification failed');
      }
    }

    setVerifying(false);
  };

  const loadSample = () => {
    setProofJson(JSON.stringify(sampleProof, null, 2));
    setResult(null);
    setParseError(null);
    toast.info('Sample proof loaded');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">Verify Receipt Proof</h1>
            <p className="text-muted-foreground">
              Verify a selective disclosure proof to confirm payment details
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Proof JSON
                </CardTitle>
                <CardDescription>
                  Paste the proof JSON received from a payer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`{
  "commitmentHash": "0x...",
  "disclosedFields": { ... },
  "signature": "sig_...",
  "timestamp": 1234567890
}`}
                  value={proofJson}
                  onChange={(e) => {
                    setProofJson(e.target.value);
                    setParseError(null);
                  }}
                  className="font-mono text-xs h-64"
                />
                
                {parseError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {parseError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleVerify}
                    disabled={verifying || !proofJson.trim()}
                    className="flex-1 glow-primary"
                  >
                    {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Proof
                  </Button>
                  <Button variant="outline" onClick={loadSample}>
                    Load Sample
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result */}
            <Card className={result ? (result.valid ? 'border-success/30' : 'border-destructive/30') : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result ? (
                    result.valid ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )
                  ) : (
                    <Shield className="h-5 w-5" />
                  )}
                  Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Paste a proof JSON and click Verify</p>
                  </div>
                ) : result.valid ? (
                  <div className="space-y-6">
                    {/* Success header */}
                    <div className="text-center p-4 rounded-lg bg-success/10 border border-success/30">
                      <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
                      <p className="font-semibold text-success">Proof Verified</p>
                      <p className="text-sm text-muted-foreground">
                        The disclosed fields are cryptographically valid
                      </p>
                    </div>

                    {/* Verified fields */}
                    <div>
                      <p className="text-sm font-medium mb-2">Verified Fields</p>
                      <div className="flex flex-wrap gap-2">
                        {result.verifiedFields.map((field) => (
                          <Badge key={field} variant="outline" className="border-success/50 text-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Signature */}
                    {result.signature && (
                      <div>
                        <p className="text-sm font-medium mb-2">Transaction Signature</p>
                        <a
                          href={`https://explorer.solana.com/tx/${result.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                        >
                          {result.signature.slice(0, 24)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {/* PayLink status */}
                    {result.paylinkStatus && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">PayLink Status</p>
                        <StatusPill status={result.paylinkStatus} size="sm" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Failure header */}
                    <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                      <XCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                      <p className="font-semibold text-destructive">Verification Failed</p>
                      <p className="text-sm text-muted-foreground">
                        The proof could not be verified
                      </p>
                    </div>

                    {/* Mismatch reasons */}
                    {result.mismatches && result.mismatches.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Issues Found</p>
                        <ul className="space-y-2">
                          {result.mismatches.map((mismatch, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                              {mismatch}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
