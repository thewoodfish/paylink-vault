import { FC, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Identicon } from '@/components/ui/Identicon';
import { CopyButton } from '@/components/ui/CopyButton';
import { setMerchantPubkey } from '@/lib/merchant';

export const ConnectWalletButton: FC = () => {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  // Auto-sync connected wallet with merchant settings
  useEffect(() => {
    if (publicKey) {
      setMerchantPubkey(publicKey.toBase58());
    }
  }, [publicKey]);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setMerchantPubkey('');
  };

  const shortenAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Identicon value={publicKey.toBase58()} size={20} />
              <span className="font-mono text-xs hidden sm:inline">
                {shortenAddress(publicKey.toBase58())}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs flex-1 truncate">
                  {publicKey.toBase58()}
                </p>
                <CopyButton value={publicKey.toBase58()} size="sm" />
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} variant="outline" size="sm" className="gap-2">
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">Connect Wallet</span>
    </Button>
  );
};
