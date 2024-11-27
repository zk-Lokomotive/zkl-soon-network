// src/hooks/useSoonNetwork.ts
import { useState, useEffect } from 'react';
import { NetworkManager } from '../services/networkManager';
import { useWallet } from '../contexts/WalletContext';
// import { toast } from 'react-hot-toast';

interface NetworkState {
  isOnSoonNetwork: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSoonNetwork() {
  const networkManager = NetworkManager.getInstance();
  const { walletAddress: publicKey, connected } = useWallet();
  const [state, setState] = useState<NetworkState>({
    isOnSoonNetwork: false,
    isLoading: false,
    error: null
  });

  const verifyConnection = async () => {
    if (!connected || !publicKey) {
      setState(prev => ({ ...prev, isOnSoonNetwork: false, error: null }));
      return;
    }

    try {
      const isConnected = await networkManager.verifyNetworkConnection();
      setState(prev => ({ 
        ...prev, 
        isOnSoonNetwork: isConnected,
        error: isConnected ? null : 'Network verification failed'
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isOnSoonNetwork: false,
        error: 'Network check failed'
      }));
    }
  };

  const switchNetwork = async () => {
    if (!connected || !publicKey) {
      setState(prev => ({ 
        ...prev, 
        isOnSoonNetwork: false, 
        error: 'Wallet not connected'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isConnected = await networkManager.waitForConnection();
      setState(prev => ({ 
        ...prev, 
        isOnSoonNetwork: isConnected, 
        isLoading: false,
        error: isConnected ? null : 'Failed to connect to SOON Network'
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isOnSoonNetwork: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Network switch failed'
      }));
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      verifyConnection();
    }
  }, [connected, publicKey]);

  return {
    isOnSoonNetwork: state.isOnSoonNetwork,
    isLoading: state.isLoading,
    error: state.error,
    connection: networkManager.getConnection(),
    switchNetwork
  };
}