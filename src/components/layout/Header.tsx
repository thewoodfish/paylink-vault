import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onMenuClick, showMenu }: HeaderProps) {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        {showMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">RP</span>
          </div>
          <span className="hidden sm:inline-block gradient-text">
            Receiptless PayLinks
          </span>
        </Link>

        {/* Demo mode badge */}
        <div className="ml-4 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium border border-warning/30">
          Demo Mode
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Wallet Connect Button */}
        <ConnectWalletButton />

        {/* Navigation links (landing page) */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-4 ml-6">
            <Link
              to="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/verify"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Verify
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
