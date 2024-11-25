import { buildPoseidon } from 'circomlibjs';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import * as snarkjs from 'snarkjs';

type ProofInput = {
  fileHash: bigint;
  sender: bigint;
  recipient: bigint;
  cidHash: bigint;
};

type Proof = {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: string;
  curve: string;
};

type ProofResult = {
  proof: string;
  publicSignals: string[];
  commitment: string;
};

interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export class ZKProofSystem {
  private poseidon: any;
  private readonly wasmFile: string;
  private readonly zkeyFile: string;

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
  ): Promise<ProofResult> {
    try {
      const fileBuffer = await file.arrayBuffer();
      const fileHash = await this.hashFile(fileBuffer);
      
      const circuitInputs: ProofInput = {
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

      const formattedProof: Proof = {
        pi_a: proof.pi_a.map(String) as [string, string, string],
        pi_b: proof.pi_b.map((arr: any[]) => arr.map(String)) as [[string, string], [string, string], [string, string]],
        pi_c: proof.pi_c.map(String) as [string, string, string],
        protocol: proof.protocol,
        curve: proof.curve
      };

      const commitment = this.poseidon([
        circuitInputs.fileHash,
        circuitInputs.sender,
        circuitInputs.recipient,
        circuitInputs.cidHash
      ]);

      return {
        proof: Buffer.from(JSON.stringify(formattedProof)).toString('base64'),
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
    verificationKey: unknown
  ): Promise<boolean> {
    try {
      const proof: Groth16Proof = JSON.parse(Buffer.from(serializedProof, 'base64').toString());
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
}