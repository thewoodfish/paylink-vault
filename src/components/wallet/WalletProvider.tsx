import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // Get cluster from environment or default to devnet
  const cluster = import.meta.env.VITE_SOLANA_CLUSTER || 'devnet';
  const heliusApiKey = import.meta.env.VITE_HELIUS_API_KEY;

  // Use Helius RPC if available, otherwise fallback to public RPC
  const endpoint = useMemo(() => {
    if (heliusApiKey && cluster === 'devnet') {
      return `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;
    } else if (heliusApiKey && cluster === 'mainnet-beta') {
      return `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
    }
    return clusterApiUrl(cluster as 'devnet' | 'mainnet-beta' | 'testnet');
  }, [cluster, heliusApiKey]);

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
