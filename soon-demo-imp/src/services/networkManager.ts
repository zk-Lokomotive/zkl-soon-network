import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

export class NetworkManager {
  private static instance: NetworkManager;
  private readonly SOON_RPC = 'https://rpc.devnet.soo.network/rpc';
  private connection: Connection;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  private constructor() {
    this.connection = new Connection(this.SOON_RPC, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: this.SOON_RPC.replace('http', 'ws')
    });
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  async switchToSoonNetwork(wallet: WalletContextState): Promise<boolean> {
    if (!wallet.connected) {
      throw new Error('Wallet not connected');
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Check if we're already on SOON network
        const currentEndpoint = await this.getCurrentEndpoint(wallet);
        if (currentEndpoint === this.SOON_RPC) {
          return true;
        }

        // Switch network based on wallet type
        if (wallet.wallet?.adapter?.name === 'Solflare') {
          // @ts-ignore - Solflare specific method
          if (window.solflare?.switchNetwork) {
            // @ts-ignore
            await window.solflare.switchNetwork('custom');
            // @ts-ignore
            await window.solflare.setCustomEndpoint(this.SOON_RPC);
            
            // Verify the switch
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for switch to complete
            const newEndpoint = await this.getCurrentEndpoint(wallet);
            if (newEndpoint === this.SOON_RPC) {
              await this.verifyNetworkConnection();
              return true;
            }
          }
        }

        // If we reach here without success, throw an error
        throw new Error('Wallet does not support network switching');
      } catch (error) {
        console.error(`Network switch attempt ${attempt} failed:`, error);
        
        if (attempt === this.retryAttempts) {
          throw new Error('Failed to switch to SOON Network after multiple attempts. Please switch manually in your wallet.');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    return false;
  }

  private async getCurrentEndpoint(wallet: WalletContextState): Promise<string | null> {
    try {
      // @ts-ignore - Solflare specific
      if (window.solflare?.connection?.rpcEndpoint) {
        // @ts-ignore
        return window.solflare.connection.rpcEndpoint;
      }
      return null;
    } catch {
      return null;
    }
  }

  async verifyNetworkConnection(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      const latency = await this.connection.getSlot();
      return latency > 0;
    } catch (error) {
      console.error('Network verification failed:', error);
      return false;
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  async reconnect(): Promise<void> {
    try {
      this.connection = new Connection(this.SOON_RPC, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: this.SOON_RPC.replace('http', 'ws')
      });
      await this.verifyNetworkConnection();
    } catch (error) {
      console.error('Reconnection failed:', error);
      throw new Error('Failed to reconnect to SOON Network');
    }
  }
}