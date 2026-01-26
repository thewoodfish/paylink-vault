import { cn } from '@/lib/utils';
import { Zap, Webhook, FileSearch, Gauge } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';

type HeliusFeature = 'webhooks' | 'enhanced-tx' | 'priority-fees' | 'rpc';

interface HeliusBadgeProps {
  feature: HeliusFeature;
  className?: string;
}

const featureConfig: Record<HeliusFeature, {
  icon: typeof Zap;
  label: string;
  description: string;
}> = {
  webhooks: {
    icon: Webhook,
    label: 'Webhooks',
    description: 'Real-time payment notifications via Helius webhooks',
  },
  'enhanced-tx': {
    icon: FileSearch,
    label: 'Enhanced TX',
    description: 'Rich transaction parsing with Helius Enhanced API',
  },
  'priority-fees': {
    icon: Gauge,
    label: 'Priority Fees',
    description: 'Dynamic fee estimation powered by Helius',
  },
  rpc: {
    icon: Zap,
    label: 'RPC',
    description: 'Fast, reliable RPC endpoints by Helius',
  },
};

export function HeliusBadge({ feature, className }: HeliusBadgeProps) {
  const config = featureConfig[feature];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'bg-[#fe5f00]/10 text-[#fe5f00] border border-[#fe5f00]/20',
            'text-xs font-medium cursor-help',
            className
          )}
        >
          <Icon className="h-3 w-3" />
          <span>Helius</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="font-medium">{config.label}</p>
        <p className="text-muted-foreground text-xs mt-1">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
