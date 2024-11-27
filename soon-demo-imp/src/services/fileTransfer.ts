// src/services/fileTransfer.ts
import { 
  PublicKey, 
  Transaction, 
  TransactionInstruction 
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { IPFSService } from './ipfs';
import { NetworkManager } from './networkManager';

export interface FileTransferMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  sender: string;
  recipient: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  transactionSignature?: string;
  ipfsUrl?: string;
  ipfsCid: string;
}

export class FileTransferService {
  private readonly PROGRAM_ID = new PublicKey('7qhC7bD9cDV9LTwjgVmGJHs5rGtrMY4pSBw1KswuaBfk');
  private networkManager: NetworkManager;
  private ipfsService: IPFSService;

  constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.ipfsService = IPFSService.getInstance();
  }

  async transferFile(
    file: File,
    wallet: WalletContextState,
    recipientAddress: string,
  ): Promise<{ signature: string; metadata: FileTransferMetadata }> {
    const connection = this.networkManager.getConnection();
    
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Cüzdan bağlı değil veya imzalama özelliği yok');
    }

    const transferToast = toast.loading('Dosya yükleniyor...');

    try {
      // Dosyayı IPFS'e yükle
      const ipfsCid = await this.ipfsService.uploadFile(file);
      const ipfsUrl = this.ipfsService.getIPFSUrl(ipfsCid);

      // Transaction'ı oluştur (sadece imza için)
      const transaction = new Transaction();
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(recipientAddress), isSigner: false, isWritable: true },
        ],
        programId: this.PROGRAM_ID,
        data: Buffer.from(JSON.stringify({
          action: 'transfer',
          ipfsCid,
          fileName: file.name,
          fileSize: file.size,
          timestamp: new Date().toISOString(),
        }))
      });

      transaction.add(instruction);
      
      // Connection'ı kullan
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sadece imzala, gönderme
      const signedTx = await wallet.signTransaction(transaction);
      const signature = signedTx.signatures[0].signature?.toString('base64') || '';

      // Metadata oluştur
      const metadata: FileTransferMetadata = {
        id: signature,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sender: wallet.publicKey.toBase58(),
        recipient: recipientAddress,
        timestamp: new Date().toISOString(),
        status: 'completed',
        transactionSignature: signature,
        ipfsUrl,
        ipfsCid
      };

      this.storeTransferMetadata(metadata);
      toast.success('Transfer tamamlandı', { id: transferToast });

      return { signature, metadata };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Transfer başarısız', {
        id: transferToast
      });
      throw error;
    }
  }

  async updateTransferFile(
    oldMetadata: FileTransferMetadata,
    newFile: File,
    wallet: WalletContextState
  ): Promise<FileTransferMetadata> {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Cüzdan bağlı değil veya imzalama özelliği yok');
    }

    const updateToast = toast.loading('Dosya güncelleniyor...');

    try {
      // Dosyayı güncelle
      const { newCid, oldCid } = await this.ipfsService.updateFile(oldMetadata.ipfsCid, newFile);
      const ipfsUrl = this.ipfsService.getIPFSUrl(newCid);

      // Transaction'ı oluştur (sadece imza için)
      const transaction = new Transaction();
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(oldMetadata.recipient), isSigner: false, isWritable: true },
        ],
        programId: this.PROGRAM_ID,
        data: Buffer.from(JSON.stringify({
          action: 'update',
          oldCid,
          newCid,
          fileName: newFile.name,
          timestamp: new Date().toISOString()
        }))
      });

      transaction.add(instruction);
      
      // Sadece imzala
      const signedTx = await wallet.signTransaction(transaction);
      const signature = signedTx.signatures[0].signature?.toString('base64') || '';

      // Yeni metadata oluştur
      const updatedMetadata: FileTransferMetadata = {
        ...oldMetadata,
        id: signature,
        fileName: newFile.name,
        fileSize: newFile.size,
        fileType: newFile.type,
        timestamp: new Date().toISOString(),
        transactionSignature: signature,
        ipfsUrl,
        ipfsCid: newCid
      };

      // Metadata'yı güncelle
      this.updateStoredMetadata(oldMetadata.id, updatedMetadata);
      
      toast.success('Dosya güncellendi', { id: updateToast });
      return updatedMetadata;

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Güncelleme başarısız', {
        id: updateToast
      });
      throw error;
    }
  }

  private storeTransferMetadata(metadata: FileTransferMetadata): void {
    try {
      const transfers = this.getStoredTransfers();
      transfers.unshift(metadata);
      localStorage.setItem('file_transfers', JSON.stringify(transfers));
    } catch (error) {
      console.error('Failed to store transfer metadata:', error);
    }
  }

  private updateStoredMetadata(oldId: string, newMetadata: FileTransferMetadata): void {
    try {
      const transfers = this.getStoredTransfers();
      const index = transfers.findIndex(t => t.id === oldId);
      if (index !== -1) {
        transfers[index] = newMetadata;
        localStorage.setItem('file_transfers', JSON.stringify(transfers));
      }
    } catch (error) {
      console.error('Metadata güncelleme hatası:', error);
    }
  }

  public getStoredTransfers(): FileTransferMetadata[] {
    try {
      const stored = localStorage.getItem('file_transfers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getTransfersByAddress(address: string, type: 'sender' | 'recipient'): FileTransferMetadata[] {
    if (!address) return [];
    return this.getStoredTransfers().filter(
      transfer => transfer[type] === address
    );
  }

  public getReceivedFiles(address: string): FileTransferMetadata[] {
    return this.getTransfersByAddress(address, 'recipient');
  }

  public getSentFiles(address: string): FileTransferMetadata[] {
    if (!address) return [];
    return this.getTransfersByAddress(address, 'sender');
  }
}