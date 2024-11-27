// import { useEffect, useState, useCallback } from 'react';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { toast } from 'react-hot-toast';
// import { WalletError } from '@solana/wallet-adapter-base';
// import { NetworkManager } from '../services/networkManager';

// export function useWalletConnection() {
//   const { 
//     connected, 
//     connecting,
//     disconnect,
//     wallet,
//     select,
//     connect,
//     publicKey,
//     wallets
//   } = useWallet();
  
//   const [isReady, setIsReady] = useState(false);
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(false);
//   const networkManager = NetworkManager.getInstance();

//   const handleError = useCallback((error: Error) => {
//     console.error('Wallet error:', error);
//     setIsConnecting(false);
//     setIsInitializing(false);
    
//     let message = 'Failed to connect wallet';
//     if (error.name === 'WalletNotReadyError') {
//       message = 'Please install Solflare wallet extension';
//     } else if (error.name === 'WalletConnectionError') {
//       message = 'Unable to connect to Solflare. Please ensure it is installed and unlocked.';
//     }
    
//     toast.error(message);
//     setIsReady(false);
//   }, []);

//   const initializeProvider = useCallback(async () => {
//     if (!wallet || !connected || !publicKey || isInitializing) return false;
    
//     setIsInitializing(true);
//     const initToast = toast.loading('Initializing wallet connection...');

//     try {
//       // Initialize provider with wallet
//       const success = await networkManager.initializeProvider({
//         publicKey,
//         connected,
//         wallet,
//         signTransaction: wallet.adapter.signTransaction.bind(wallet.adapter),
//         signAllTransactions: wallet.adapter.signAllTransactions.bind(wallet.adapter),
//         signMessage: wallet.adapter.signMessage?.bind(wallet.adapter)
//       });
      
//       if (!success) {
//         toast.error('Failed to initialize wallet provider', { id: initToast });
//         return false;
//       }

//       // Verify network connection
//       const isConnected = await networkManager.verifyNetworkConnection();
//       if (!isConnected) {
//         toast.error('Failed to connect to SOON Network', { id: initToast });
//         return false;
//       }

//       toast.success('Wallet connection initialized', { id: initToast });
//       return true;
//     } catch (error) {
//       console.error('Provider initialization failed:', error);
//       toast.error('Failed to initialize wallet provider', { id: initToast });
//       return false;
//     } finally {
//       setIsInitializing(false);
//     }
//   }, [wallet, connected, publicKey, isInitializing]);

//   useEffect(() => {
//     if (connecting || isConnecting) {
//       toast.loading('Connecting Solflare wallet...', { id: 'wallet-connect' });
//     } else if (connected && wallet && publicKey && !isReady) {
//       initializeProvider().then(success => {
//         if (success) {
//           toast.success('Connected to Solflare', { id: 'wallet-connect' });
//           setIsReady(true);
//           setIsConnecting(false);
//         }
//       });
//     } else if (!connected && isReady) {
//       toast.error('Wallet disconnected', { id: 'wallet-connect' });
//       setIsReady(false);
//       setIsConnecting(false);
//     }
//   }, [connected, connecting, wallet, publicKey, isReady, isConnecting, initializeProvider]);

//   useEffect(() => {
//     if (wallet?.adapter) {
//       wallet.adapter.on('error', handleError);
//       return () => {
//         wallet.adapter.off('error', handleError);
//       };
//     }
//   }, [wallet, handleError]);

//   const connectWallet = useCallback(async () => {
//     try {
//       setIsConnecting(true);
      
//       // Find Solflare wallet adapter
//       const solflareWallet = wallets.find(w => w.adapter.name === 'Solflare');
//       if (!solflareWallet) {
//         throw new Error('Solflare wallet not found');
//       }

//       // Select and connect
//       await select(solflareWallet.adapter.name);
//       if (connect) {
//         await connect();
//       }
//     } catch (error) {
//       console.error('Failed to connect wallet:', error);
//       handleError(error as Error);
//     }
//   }, [select, connect, wallets, handleError]);

//   const disconnectWallet = useCallback(async () => {
//     try {
//       await disconnect();
//       setIsReady(false);
//       toast.success('Wallet disconnected');
//     } catch (error) {
//       console.error('Failed to disconnect wallet:', error);
//       toast.error('Failed to disconnect wallet');
//     }
//   }, [disconnect]);

//   return {
//     isReady,
//     wallet,
//     connected,
//     connecting: connecting || isConnecting || isInitializing,
//     connectWallet,
//     disconnectWallet,
//     publicKey
//   };
// }