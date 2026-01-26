import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Copy, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Identicon } from '@/components/ui/Identicon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getMerchantPubkey, setMerchantPubkey } from '@/lib/merchant';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onMenuClick, showMenu }: HeaderProps) {
  const location = useLocation();
  const [pubkey, setPubkey] = useState(getMerchantPubkey());
  const [inputPubkey, setInputPubkey] = useState(pubkey);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDashboard = location.pathname.startsWith('/dashboard');

  const handleSavePubkey = () => {
    setMerchantPubkey(inputPubkey);
    setPubkey(inputPubkey);
    setDialogOpen(false);
  };

  const shortenPubkey = (pk: string) => {
    if (pk.length <= 12) return pk;
    return `${pk.slice(0, 6)}...${pk.slice(-4)}`;
  };

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

        {/* Wallet / Pubkey section */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {pubkey ? (
                <>
                  <Identicon value={pubkey} size={20} />
                  <span className="font-mono text-xs hidden sm:inline">
                    {shortenPubkey(pubkey)}
                  </span>
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">Set Merchant</span>
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Merchant Public Key</DialogTitle>
              <DialogDescription>
                Enter your Solana public key to use as merchant identity. This is stored locally in your browser.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pubkey">Public Key</Label>
                <Input
                  id="pubkey"
                  placeholder="Enter your Solana public key..."
                  value={inputPubkey}
                  onChange={(e) => setInputPubkey(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePubkey}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {pubkey && (
          <CopyButton value={pubkey} className="ml-1" />
        )}

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
