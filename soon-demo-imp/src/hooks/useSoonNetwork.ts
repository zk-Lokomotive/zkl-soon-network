import { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NetworkManager } from '../services/networkManager';
import { toast } from 'react-hot-toast';
import { WalletContextState } from '@solana/wallet-adapter-react'; 

export function useSoonNetwork() {
  const { connected, wallet, publicKey } = useWallet();
  const [state, setState] = useState({
    isOnSoonNetwork: false,
    isLoading: false,
    retryCount: 0
  });
  const maxRetries = 3;
  const networkManagerRef = useRef(NetworkManager.getInstance());

  const checkNetworkConnection = useCallback(async () => {
    if (!connected || !wallet) {
      setState(prev => ({ ...prev, isOnSoonNetwork: false }));
      return false;
    }
    return await networkManagerRef.current.verifyNetworkConnection();
  }, [connected, wallet]);

  const switchNetwork = useCallback(async () => {
    if (!connected || !wallet || !publicKey) {
      setState(prev => ({ ...prev, isOnSoonNetwork: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    const switchToast = toast.loading('Connecting to SOON Network...');

    try {
      const isConnected = await checkNetworkConnection();
      if (isConnected) {
        setState(prev => ({ ...prev, isOnSoonNetwork: true, isLoading: false, retryCount: 0 }));
        toast.success('Already connected to SOON Network', { id: switchToast });
        return;
      }
      const walletInstance = wallet as unknown as WalletContextState; 


      const switched = await networkManagerRef.current.switchToSoonNetwork(walletInstance);
      
      if (switched) {
        setState(prev => ({ 
          ...prev, 
          isOnSoonNetwork: true, 
          isLoading: false, 
          retryCount: 0 
        }));
        toast.success('Connected to SOON Network', { id: switchToast });
      } else {
        setState(prev => {
          const newRetryCount = prev.retryCount + 1;
          if (newRetryCount >= maxRetries) {
            toast.error('Failed to connect after multiple attempts. Please try again later.');
          }
          return {
            ...prev,
            isOnSoonNetwork: false,
            isLoading: false,
            retryCount: newRetryCount
          };
        });
        toast.error('Please switch to SOON Network in your wallet', { id: switchToast });
      }
    } catch (error) {
      console.error('Network switch failed:', error);
      setState(prev => ({ ...prev, isOnSoonNetwork: false, isLoading: false }));
      
      if (error instanceof Error) {
        if (error.message.includes('Wallet not connected')) {
          toast.error('Please connect your wallet first', { id: switchToast });
        } else if (error.message.includes('does not support network switching')) {
          toast.error('Your wallet does not support automatic network switching. Please switch manually.', { id: switchToast });
        } else {
          toast.error('Failed to connect to SOON Network. Please try again.', { id: switchToast });
        }
      } else {
        toast.error('An unexpected error occurred', { id: switchToast });
      }
    }
  }, [connected, wallet, publicKey, checkNetworkConnection, maxRetries]);

  useEffect(() => {
    let mounted = true;

    if (connected && wallet && publicKey && mounted) {
      switchNetwork();
    }

    return () => {
      mounted = false;
    };
  }, [connected, wallet, publicKey, switchNetwork]);

  useEffect(() => {
    if (!state.isOnSoonNetwork || !connected) return;

    let mounted = true;
    const intervalId = setInterval(async () => {
      if (!mounted) return;

      const isStillConnected = await checkNetworkConnection();
      if (!isStillConnected && state.isOnSoonNetwork && mounted) {
        setState(prev => ({ ...prev, isOnSoonNetwork: false }));
        toast.error('Lost connection to SOON Network. Attempting to reconnect...');
        switchNetwork();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [state.isOnSoonNetwork, connected, checkNetworkConnection, switchNetwork]);

  useEffect(() => {
    if (!connected && state.isOnSoonNetwork) {
      setState(prev => ({ ...prev, isOnSoonNetwork: false }));
    }
  }, [connected, state.isOnSoonNetwork]);

  return {
    isOnSoonNetwork: state.isOnSoonNetwork,
    isLoading: state.isLoading,
    connection: networkManagerRef.current.getConnection(),
    switchNetwork,
    retryCount: state.retryCount,
    maxRetries
  };
}