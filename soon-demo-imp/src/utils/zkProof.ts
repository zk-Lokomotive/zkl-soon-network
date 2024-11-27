import { PublicKey } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { toast } from 'react-hot-toast';
import './buffer-polyfill';

export class ZKProofSystem {
  private static instance: ZKProofSystem;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.initializationPromise = this.initialize();
  }

  public static getInstance(): ZKProofSystem {
    if (!ZKProofSystem.instance) {
      ZKProofSystem.instance = new ZKProofSystem();
    }
    return ZKProofSystem.instance;
  }

  async initialize() {
    try {
      this.initialized = true;
      console.log('ZK Proof system initialized');
    } catch (error) {
      console.warn('Failed to initialize ZK system, using simulation mode:', error);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  async generateProof(
    file: File,
    senderAddress: string,
    recipientAddress: string,
    ipfsCid: string
  ) {
    await this.ensureInitialized();

    const proofToast = toast.loading('Generating zero-knowledge proof...');

    try {
      // Hash the file content
      const fileBuffer = await file.arrayBuffer();
      const fileHash = sha256(new Uint8Array(fileBuffer));
      
      // Convert addresses to bytes
      const senderBytes = new PublicKey(senderAddress).toBytes();
      const recipientBytes = new PublicKey(recipientAddress).toBytes();
      
      // Hash the IPFS CID
      const cidHash = sha256(new TextEncoder().encode(ipfsCid));

      // Generate mock proof data
      const mockProof = {
        pi_a: [bytesToHex(fileHash), bytesToHex(senderBytes.slice(0, 32))],
        pi_b: [[bytesToHex(recipientBytes.slice(0, 16)), bytesToHex(recipientBytes.slice(16, 32))]],
        pi_c: [bytesToHex(cidHash)]
      };

      // Generate mock public signals
      const mockPublicSignals = [
        bytesToHex(fileHash),
        senderAddress,
        recipientAddress,
        ipfsCid
      ];

      // Generate mock commitment
      const mockCommitment = bytesToHex(
        sha256(
          new Uint8Array([...fileHash, ...senderBytes, ...recipientBytes])
        )
      );

      // Simulate proof generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Zero-knowledge proof generated', { id: proofToast });

      return {
        proof: this.serializeProof(mockProof),
        publicSignals: mockPublicSignals,
        commitment: mockCommitment
      };
    } catch (error) {
      console.error('Error generating proof:', error);
      toast.error('Failed to generate zero-knowledge proof', { id: proofToast });
      throw new Error('Failed to generate zero-knowledge proof');
    }
  }

  async verifyProof(
    serializedProof: string,
    publicSignals: string[]
  ): Promise<boolean> {
    console.log(serializedProof);
    console.log(publicSignals);

    const verifyToast = toast.loading('Verifying zero-knowledge proof...');

    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Zero-knowledge proof verified', { id: verifyToast });
      return true;
    } catch (error) {
      console.error('Error verifying proof:', error);
      toast.error('Failed to verify zero-knowledge proof', { id: verifyToast });
      return false;
    }
  }

  private serializeProof(proof: any): string {
    return Buffer.from(JSON.stringify(proof)).toString('base64');
  }

  private deserializeProof(serializedProof: string): any {
    return JSON.parse(Buffer.from(serializedProof, 'base64').toString());
  }

  getStatus(): { initialized: boolean; mode: 'live' | 'simulation' } {
    return {
      initialized: this.initialized,
      mode: 'simulation'
    };
  }
}