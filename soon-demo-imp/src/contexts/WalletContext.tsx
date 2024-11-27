import React, { createContext, useContext, useEffect, useState } from "react";
import { BackpackConnector } from "../lib/BackpackConnector.ts";
import { PublicKey, Transaction, Connection, VersionedTransaction } from "@solana/web3.js";
import { WalletContextState as SolanaWalletContextState } from '@solana/wallet-adapter-react';

const RPC_URL = "https://rpc.testnet.soo.network/rpc";

// Define types for the context state
interface WalletContextProps {
  walletAddress: PublicKey | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  connecting: boolean;
  connected: boolean;
  wallet: SolanaWalletContextState;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const useWallet = (): WalletContextProps => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

const WalletProvider: React.FC<{ children: any }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<PublicKey | null>(null);
  const backpackConnector = new BackpackConnector(RPC_URL);

  const wallet: SolanaWalletContextState = {
    autoConnect: false,
    wallets: [],
    wallet: null,
    publicKey: walletAddress,
    connecting: false,
    connected: !!walletAddress,
    disconnecting: false,
    select: () => {},
    connect: async () => {
      const publicKey = await backpackConnector.connect();
      if (publicKey) {
        setWalletAddress(publicKey);
      }
    },
    disconnect: async () => {
      backpackConnector.disconnect();
      setWalletAddress(null);
    },
    sendTransaction: async (transaction: Transaction, connection: Connection) => {
      if (!walletAddress) throw new Error("Wallet not connected");
      const signature = await backpackConnector.signTransaction(transaction);
      await connection.sendRawTransaction(signature.serialize());
      return signature;
    },
    signTransaction: async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      return backpackConnector.signTransaction(transaction) as Promise<T>;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      return Promise.all(transactions.map(tx => backpackConnector.signTransaction(tx))) as Promise<T[]>;
    },
    signMessage: async (_message: Uint8Array) => {
      if (!walletAddress) throw new Error("Wallet not connected");
      throw new Error("signMessage not implemented");
    },
    signIn: async () => {
      throw new Error("signIn not implemented");
    }
  };

  const connectWallet = async () => {
    const publicKey = await backpackConnector.connect();
    if (publicKey) {
      setWalletAddress(publicKey);
    }
  };

  const disconnectWallet = () => {
    backpackConnector?.disconnect();
    setWalletAddress(null);
  };

  const signTransaction = async (transaction: Transaction) => {
    return backpackConnector.signTransaction(transaction);
  };

  useEffect(() => {
    const backpackWallet = (window as any).backpack;
    if (backpackWallet && backpackWallet.isConnected) {
      backpackWallet.connect({ onlyIfTrusted: true }).then((response: any) => {
        setWalletAddress(new PublicKey(response.publicKey.toString()));
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        disconnectWallet,
        signTransaction,
        connecting: false,
        connected: !!walletAddress,
        wallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export { WalletProvider };