import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { IPFSService } from './ipfs';
import { toast } from 'react-hot-toast';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { createHash } from 'crypto';


export interface FileTransferMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  sender: string;
  recipient: string;
  proofHash: string;
  ipfsHash: string;
  ipfsUrl: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

declare global {
  interface Window {
    solflare?: {
      switchNetwork: (network: string) => Promise<void>;
      setCustomEndpoint: (endpoint: string) => Promise<void>;
    };
  }
}

export class FileTransferService {
  private connection: Connection;
  private ipfsService: IPFSService;
  private readonly PROGRAM_ID = new PublicKey('EtoMxUTxY8qR3QXLXnssh3A7GWQHwY7eeJc4A3r6tVBa');
  private readonly SOON_ENDPOINT = 'https://rpc.devnet.soo.network/rpc';

  constructor() {
    this.connection = new Connection(this.SOON_ENDPOINT, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
    this.ipfsService = IPFSService.getInstance();
  }

  async initialize() {
    try {
      await this.validateConnection();
    } catch (error) {
      console.error('Failed to initialize services:', error);
      toast.error('Failed to initialize services. Please refresh the page.');
    }
  }

  private async validateConnection() {
    try {
      const version = await this.connection.getVersion();
      console.log('Connected to SOON network:', version);
    } catch (error) {
      console.error('Failed to connect to SOON network:', error);
      throw new Error('Failed to connect to SOON network. Please check your connection.');
    }
  }

  async switchToSoonNetwork(wallet: WalletContextState): Promise<boolean> {
    if (!wallet.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (wallet.wallet?.adapter?.name === 'Solflare' && window.solflare?.switchNetwork) {
        await window.solflare.switchNetwork('custom');
        await window.solflare.setCustomEndpoint(this.SOON_ENDPOINT);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw new Error('Failed to switch to SOON Network');
    }
  }

  async transferFile(
    file: File,
    senderPublicKey: PublicKey,
    recipientAddress: string,
    wallet: WalletContextState
  ): Promise<{ signature: string; ipfsUrl: string; metadata: FileTransferMetadata }> {
    try {
      const uploadToast = toast.loading('Uploading file to IPFS...');
      const ipfsHash = await this.ipfsService.uploadFile(file);
      const ipfsUrl = this.ipfsService.getIPFSUrl(ipfsHash);
      toast.success('File uploaded to IPFS', { id: uploadToast });

      const txToast = toast.loading('Preparing SOON transaction...');
      
      const recipientPubKey = new PublicKey(recipientAddress);
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: senderPublicKey, isSigner: true, isWritable: true },
          { pubkey: recipientPubKey, isSigner: false, isWritable: true },
        ],
        programId: this.PROGRAM_ID,
        data: Buffer.from(JSON.stringify({ ipfsHash, ipfsUrl }))
      });

      try {
        if (!wallet || !wallet.signTransaction) {
          throw new Error('Wallet is not defined or does not support signing transactions');
        }

        const latestBlockhash = await this.connection.getLatestBlockhash();
        const transaction = new Transaction();
        transaction.add(instruction);
        transaction.feePayer = senderPublicKey;
        transaction.recentBlockhash = latestBlockhash.blockhash;

        const signed = await wallet.signTransaction(transaction);
        
        const signature = await this.connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
          maxRetries: 5
        });

        await this.connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');
        
        const fileBuffer = await file.arrayBuffer(); 
        const proofHash = createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex'); // SHA-256 hash 


        const metadata: FileTransferMetadata = {
          id: signature,
          fileName: file.name,
          fileSize: file.size, 
          fileType: file.type,
          sender: senderPublicKey.toBase58(),
          recipient: recipientAddress,
          proofHash,
          ipfsHash,
          ipfsUrl,
          timestamp: new Date().toISOString(),
          status: 'completed'
        };

        this.addTransfer(metadata);
        toast.success('Transfer completed on SOON Network', { id: txToast });

        return { signature, ipfsUrl, metadata };
      } catch (error) {
        console.error('Transaction failed:', error);
        toast.error('SOON Network transaction failed', { id: txToast });
        throw error;
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }

  private addTransfer(metadata: FileTransferMetadata) {
    try {
      const transfers = this.getAllTransfers();
      transfers.unshift(metadata);
      localStorage.setItem('zkl_transfers', JSON.stringify(transfers));
    } catch (error) {
      console.error('Failed to store transfer metadata:', error);
    }
  }

  private getAllTransfers(): FileTransferMetadata[] {
    try {
      const stored = localStorage.getItem('zkl_transfers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getReceivedFiles(publicKey: string): FileTransferMetadata[] {
    if (!publicKey) return [];
    return this.getAllTransfers().filter(
      (transfer: FileTransferMetadata) => transfer.recipient === publicKey
    );
  }

  getSentFiles(publicKey: string): FileTransferMetadata[] {
    if (!publicKey) return [];
    return this.getAllTransfers().filter(
      (transfer: FileTransferMetadata) => transfer.sender === publicKey
    );
  }
}