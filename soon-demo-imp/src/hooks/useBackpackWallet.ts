// import { useState, useCallback, useEffect } from 'react';
// import { Connection, PublicKey } from '@solana/web3.js';
// import { BackpackWallet } from '../services/backpackWallet';
// import { toast } from 'react-hot-toast';

// export function useBackpackWallet(connection: Connection | null) {
//   const [wallet, setWallet] = useState<BackpackWallet | null>(null);
//   const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
//   const [connected, setConnected] = useState(false);
//   const [connecting, setConnecting] = useState(false);

//   useEffect(() => {
//     if (!connection) {
//       setWallet(null);
//       setConnected(false);
//       return;
//     }

//     const backpackWallet = BackpackWallet.getInstance(connection);
//     setWallet(backpackWallet);

//     // Check if already connected
//     if (backpackWallet.isConnected()) {
//       setPublicKey(backpackWallet.getPublicKey());
//       setConnected(true);
//     }
//   }, [connection]);

//   const connect = useCallback(async () => {
//     if (!wallet) {
//       toast.error('Wallet not initialized');
//       return;
//     }

//     try {
//       setConnecting(true);
//       const connectToast = toast.loading('Connecting to Backpack...');
//       const { publicKey: connectedKey } = await wallet.connect();
//       setPublicKey(connectedKey);
//       setConnected(true);
//       toast.success('Connected to Backpack', { id: connectToast });
//     } catch (error) {
//       console.error('Failed to connect to Backpack:', error);
//       toast.error('Failed to connect to Backpack');
//     } finally {
//       setConnecting(false);
//     }
//   }, [wallet]);

//   const disconnect = useCallback(async () => {
//     if (!wallet) {
//       return;
//     }

//     try {
//       const disconnectToast = toast.loading('Disconnecting from Backpack...');
//       await wallet.disconnect();
//       setPublicKey(null);
//       setConnected(false);
//       toast.success('Disconnected from Backpack', { id: disconnectToast });
//     } catch (error) {
//       console.error('Failed to disconnect from Backpack:', error);
//       toast.error('Failed to disconnect from Backpack');
//     }
//   }, [wallet]);

//   return {
//     wallet,
//     publicKey,
//     connected,
//     connecting,
//     connect,
//     disconnect
//   };
// }