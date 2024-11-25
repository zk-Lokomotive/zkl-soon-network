import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ConnectionProvider, 
  WalletProvider 
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import App from './App';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new BackpackWalletAdapter(),
  new TorusWalletAdapter()
];

const endpoint = 'https://rpc.devnet.soo.network/rpc';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>
);