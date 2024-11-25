import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { ZKProofSystem } from '../utils/zkProof';
import { IPFSService } from './ipfs';

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
    // Upload file to IPFS
    const ipfsCid = await this.ipfsService.uploadFile(file);

    // Generate ZK proof with IPFS CID
    const { commitment, proof } = await this.zkSystem.generateProof(
      file,
      senderPublicKey.toBase58(),
      recipientAddress,
      ipfsCid
    );

    // Create transaction instruction with proof and IPFS CID
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: senderPublicKey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(recipientAddress), isSigner: false, isWritable: true },
      ],
      programId: this.PROGRAM_ID,
      data: Buffer.from(JSON.stringify({ proof, ipfsCid }))
    });

    // Send transaction
    const transaction = new Transaction().add(instruction);
    const signature = await sendTransaction(transaction, this.connection);
    await this.connection.confirmTransaction(signature);

    return { 
      signature, 
      commitment,
      ipfsCid,
      ipfsUrl: this.ipfsService.getIPFSUrl(ipfsCid)
    };
  }

  async retrieveFile(cid: string): Promise<Uint8Array> {
    return await this.ipfsService.downloadFile(cid);
  }
}