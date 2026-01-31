import { Shield, Zap, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LightProtocolBadgeProps {
  enabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  showDetails?: boolean;
}

export function LightProtocolBadge({
  enabled = true,
  variant = 'default',
  showDetails = false,
}: LightProtocolBadgeProps) {
  if (!enabled) {
    return null;
  }

  const badge = (
    <Badge variant={variant} className="gap-1.5 font-medium">
      <Shield className="h-3 w-3" />
      <span>ZK Compression</span>
      <Zap className="h-3 w-3 text-yellow-500" />
    </Badge>
  );

  if (showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4" />
                <span>Light Protocol ZK Compression</span>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Privacy:</strong> Payments use zero-knowledge proofs and Merkle tree commitments
                </p>
                <p>
                  <strong>Cost:</strong> 99.7% cheaper than regular token accounts (no rent required)
                </p>
                <p>
                  <strong>Performance:</strong> Full composability with Solana programs
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

interface LightProtocolInfoCardProps {
  className?: string;
}

export function LightProtocolInfoCard({ className }: LightProtocolInfoCardProps) {
  return (
    <div className={`rounded-lg border border-primary/20 bg-primary/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="font-semibold flex items-center gap-2">
            <span>Powered by Light Protocol ZK Compression</span>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            This PayLink uses <strong>compressed tokens</strong> for privacy-preserving payments.
            Transactions are secured with zero-knowledge proofs and stored as Merkle tree commitments,
            reducing costs by 99%+ while maintaining full Solana security.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-3 text-sm">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Privacy</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ZK proofs protect payment details
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span>Low Cost</span>
              </div>
              <p className="text-xs text-muted-foreground">
                No rent fees, 99.7% savings
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Audited L1 security guarantees
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
