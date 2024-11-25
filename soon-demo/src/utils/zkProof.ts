import { buildPoseidon } from 'circomlibjs';
import { PublicKey } from '@solana/web3.js';
import * as snarkjs from 'snarkjs';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export class ZKProofSystem {
  private poseidon: any;
  private wasmFile: string;
  private zkeyFile: string;

  constructor() {
    this.wasmFile = '/circuits/transfer.wasm';
    this.zkeyFile = '/circuits/transfer.zkey';
  }

  async initialize() {
    try {
      this.poseidon = await buildPoseidon();
    } catch (error) {
      console.error('Error initializing Poseidon:', error);
      throw new Error('Failed to initialize ZK proof system');
    }
  }

  async generateProof(
    file: File,
    senderAddress: string,
    recipientAddress: string,
    ipfsCid: string
  ) {
    try {
      const fileBuffer = await file.arrayBuffer();
      const fileHash = await this.hashFile(fileBuffer);
      
      const circuitInputs = {
        fileHash: BigInt('0x' + fileHash),
        sender: BigInt('0x' + this.hashString(senderAddress)),
        recipient: BigInt('0x' + this.hashString(recipientAddress)),
        cidHash: BigInt('0x' + this.hashString(ipfsCid))
      };

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        this.wasmFile,
        this.zkeyFile
      );

      const commitment = this.poseidon([
        circuitInputs.fileHash,
        circuitInputs.sender,
        circuitInputs.recipient,
        circuitInputs.cidHash
      ]);

      return {
        proof: this.serializeProof(proof),
        publicSignals,
        commitment: commitment.toString()
      };
    } catch (error) {
      console.error('Error generating proof:', error);
      throw new Error('Failed to generate ZK proof');
    }
  }

  async verifyProof(
    serializedProof: string,
    publicSignals: string[],
    verificationKey: any
  ): Promise<boolean> {
    try {
      const proof = this.deserializeProof(serializedProof);
      return await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
    } catch (error) {
      console.error('Error verifying proof:', error);
      return false;
    }
  }

  private async hashFile(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = sha256(new Uint8Array(buffer));
    return bytesToHex(hashBuffer);
  }

  private hashString(value: string): string {
    const hashBuffer = sha256(new TextEncoder().encode(value));
    return bytesToHex(hashBuffer);
  }

  private serializeProof(proof: any): string {
    return Buffer.from(JSON.stringify(proof)).toString('base64');
  }

  private deserializeProof(serializedProof: string): any {
    return JSON.parse(Buffer.from(serializedProof, 'base64').toString());
  }
}