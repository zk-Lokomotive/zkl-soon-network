// lib/BackpackConnector.ts
import { PublicKey, Connection } from "@solana/web3.js";

export class BackpackConnector {
  private connection: Connection;
  private publicKey: PublicKey | null = null;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
  }

  // Connect to Backpack
  async connect(): Promise<PublicKey | null> {
    try {
      const backpackWallet = (window as any).backpack;

      if (!backpackWallet || !backpackWallet.isBackpack) {
        window.alert("Lütfen Backpack Wallet'ı yükleyin");
        window.open("https://www.backpack.app/", "_blank");
        return null;
      }

      if (!(window as any).ethereum) {
        Object.defineProperty(window, 'ethereum', {
          value: backpackWallet,
          writable: false,
          configurable: true
        });
      }

      const response = await backpackWallet.connect();
      this.publicKey = new PublicKey(response.publicKey.toString());
      return this.publicKey;
    } catch (error) {
      console.error("Backpack Wallet bağlantısı başarısız:", error);
      return null;
    }
  }

  // Disconnect from Backpack
  disconnect() {
    (window as any).backpack?.disconnect();
    this.publicKey = null;
  }

  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }

  getConnection(): Connection {
    return this.connection;
  }

  signTransaction(transaction: any) {
    return (window as any).backpack.signTransaction(transaction);
  }
}