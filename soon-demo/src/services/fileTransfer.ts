import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { ZKProofSystem } from '../utils/zkProof';
import { IPFSService } from './ipfs';

export interface FileTransferMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  sender: string;
  recipient: string;
  ipfsHash: string;
  timestamp: string;
  proofHash: string;
  status: 'pending' | 'completed' | 'failed';
}

export class FileTransferService {
  private connection: Connection;
  private zkSystem: ZKProofSystem;
  private ipfsService: IPFSService;
  private readonly PROGRAM_ID = new PublicKey('EtoMxUTxY8qR3QXLXnssh3A7GWQHwY7eeJc4A3r6tVBa');

  constructor() {
    this.connection = new Connection('https://rpc.devnet.soo.network/rpc');
    this.zkSystem = new ZKProofSystem();
    this.ipfsService = IPFSService.getInstance();
  }

  async initialize() {
    await this.zkSystem.initialize();
  }

  async transferFile(
    file: File,
    senderPublicKey: PublicKey,
    recipientAddress: string,
    sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>
  ) {
    try {
      // Upload file to IPFS
      const ipfsHash = await this.ipfsService.uploadFile(file);
      const ipfsUrl = this.ipfsService.getIPFSUrl(ipfsHash);

      // Generate ZK proof
      const { commitment, proof } = await this.zkSystem.generateProof(
        file,
        senderPublicKey.toBase58(),
        recipientAddress,
        ipfsHash
      );

      // Create transaction instruction
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: senderPublicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(recipientAddress), isSigner: false, isWritable: true },
        ],
        programId: this.PROGRAM_ID,
        data: Buffer.from(JSON.stringify({ proof, ipfsHash }))
      });

      // Send transaction
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, this.connection);
      await this.connection.confirmTransaction(signature);

      // Create transfer metadata
      const metadata: FileTransferMetadata = {
        id: signature,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sender: senderPublicKey.toBase58(),
        recipient: recipientAddress,
        ipfsHash,
        timestamp: new Date().toISOString(),
        proofHash: commitment,
        status: 'completed'
      };

      // Store metadata in local storage
      this.storeTransferMetadata(metadata);

      return { 
        signature,
        ipfsUrl,
        metadata
      };
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }

  private storeTransferMetadata(metadata: FileTransferMetadata) {
    try {
      const transfers = this.getStoredTransfers();
      transfers.push(metadata);
      localStorage.setItem('zkl_transfers', JSON.stringify(transfers));
    } catch (error) {
      console.error('Failed to store transfer metadata:', error);
    }
  }

  getStoredTransfers(): FileTransferMetadata[] {
    try {
      const stored = localStorage.getItem('zkl_transfers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getReceivedFiles(publicKey: string): FileTransferMetadata[] {
    return this.getStoredTransfers().filter(
      transfer => transfer.recipient === publicKey
    );
  }

  getSentFiles(publicKey: string): FileTransferMetadata[] {
    return this.getStoredTransfers().filter(
      transfer => transfer.sender === publicKey
    );
  }

  async downloadFile(ipfsHash: string): Promise<Uint8Array> {
    return await this.ipfsService.downloadFile(ipfsHash);
  }
}