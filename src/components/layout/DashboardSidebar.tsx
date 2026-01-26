import { Link, useLocation } from 'react-router-dom';
import {
  Link2,
  Plus,
  Receipt,
  Settings,
  LayoutDashboard,
  X,
  Zap,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMerchantSettings } from '@/lib/merchant';

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: 'PayLinks',
    href: '/dashboard/paylinks',
    icon: Link2,
  },
  {
    label: 'New PayLink',
    href: '/dashboard/paylinks/new',
    icon: Plus,
  },
  {
    label: 'Receipts',
    href: '/dashboard/receipts',
    icon: Receipt,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const location = useLocation();
  const settings = getMerchantSettings();

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r border-border bg-sidebar transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 lg:hidden"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col h-full p-4">
          {/* Environment badge */}
          <div className="flex items-center gap-2 mb-6 mt-2">
            <Badge
              variant="outline"
              className={cn(
                'gap-1',
                settings.environment === 'devnet'
                  ? 'border-warning/50 text-warning'
                  : 'border-success/50 text-success'
              )}
            >
              <Globe className="h-3 w-3" />
              {settings.environment === 'devnet' ? 'Devnet' : 'Mainnet'}
            </Badge>
            <Badge variant="outline" className="gap-1 border-[#fe5f00]/50 text-[#fe5f00]">
              <Zap className="h-3 w-3" />
              Helius
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href === '/dashboard/paylinks' &&
                  location.pathname.startsWith('/dashboard/paylinks') &&
                  location.pathname !== '/dashboard/paylinks/new');

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-sidebar-border">
            <Link
              to="/verify"
              className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-foreground transition-colors"
            >
              <Receipt className="h-4 w-4" />
              Verify a Receipt
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
