import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import App from './App';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';

// Global polyfills are now handled by vite-plugin-node-polyfills
const wallets = [new SolflareWalletAdapter()];
const endpoint = 'https://rpc.devnet.soo.network/rpc';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>
);