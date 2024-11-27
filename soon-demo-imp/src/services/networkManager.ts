// src/services/networkManager.ts
import { Connection, Commitment } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';

export class NetworkManager {
  private static instance: NetworkManager;
  private connection: Connection;
  private provider: AnchorProvider | null = null;
  private readonly SOON_RPC = 'https://rpc.testnet.soo.network/rpc';
  private readonly COMMITMENT: Commitment = 'confirmed';

  private constructor() {
    this.connection = new Connection(this.SOON_RPC, {
      commitment: this.COMMITMENT,
      confirmTransactionInitialTimeout: 60000
    });
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public async initializeProvider(wallet: WalletContextState): Promise<boolean> {
    if (!wallet.connected || !wallet.publicKey) {
      return false;
    }

    try {
      this.provider = new AnchorProvider(
        this.connection,
        wallet as any,
        { commitment: this.COMMITMENT }
      );
      return true;
    } catch (error) {
      console.error('Provider initialization failed:', error);
      this.provider = null;
      return false;
    }
  }

  public async verifyNetworkConnection(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      console.log('Network version:', version);
      return true;
    } catch (error) {
      console.error('Network connection error:', error);
      return false;
    }
  }

  public async waitForConnection(): Promise<boolean> {
    const networkToast = toast.loading('Connecting to SOON Network...');

    try {
      const isConnected = await this.verifyNetworkConnection();
      
      if (isConnected) {
        toast.success('Connected to SOON Network', { id: networkToast });
        return true;
      }

      toast.error('Failed to connect to SOON Network', { id: networkToast });
      return false;
    } catch (error) {
      toast.error('Network connection failed', { id: networkToast });
      return false;
    }
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public getProvider(): AnchorProvider | null {
    return this.provider;
  }

  public getEndpoint(): string {
    return this.SOON_RPC;
  }

  public disconnect(): void {
    this.provider = null;
  }
}