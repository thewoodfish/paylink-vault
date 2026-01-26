import { cn } from '@/lib/utils';
import { Shield, ShieldCheck, ShieldAlert, EyeOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';

type PrivacyLevel = 'full' | 'partial' | 'minimal' | 'selective';

interface PrivacyBadgeProps {
  level: PrivacyLevel;
  showLabel?: boolean;
  className?: string;
}

const levelConfig: Record<PrivacyLevel, {
  icon: typeof Shield;
  label: string;
  description: string;
  className: string;
}> = {
  full: {
    icon: ShieldCheck,
    label: 'Full Privacy',
    description: 'All payment details are encrypted and hidden',
    className: 'bg-success/10 text-success border-success/20',
  },
  partial: {
    icon: Shield,
    label: 'Partial Privacy',
    description: 'Some fields are visible, others are hidden',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  minimal: {
    icon: ShieldAlert,
    label: 'Minimal Privacy',
    description: 'Most fields are publicly visible',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  selective: {
    icon: EyeOff,
    label: 'Selective Disclosure',
    description: 'You choose exactly which fields to reveal',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
};

export function PrivacyBadge({ level, showLabel = true, className }: PrivacyBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'border text-xs font-medium cursor-help',
            config.className,
            className
          )}
        >
          <Icon className="h-3 w-3" />
          {showLabel && <span>{config.label}</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <p className="font-medium">{config.label}</p>
        <p className="text-muted-foreground text-xs mt-1">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
