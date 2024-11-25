import { create } from 'ipfs-http-client';
import type { IPFSHTTPClient } from 'ipfs-http-client';

export class IPFSService {
  private ipfs: IPFSHTTPClient;
  private static instance: IPFSService;

  private constructor() {
    this.ipfs = create({
      host: 'localhost',
      port: 5001,
      protocol: 'http'
    });
  }

  public static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const result = await this.ipfs.add(buffer);
      return result.path;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  async downloadFile(cid: string): Promise<Uint8Array> {
    try {
      const chunks: Uint8Array[] = [];
      let totalLength = 0;


      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
        totalLength += chunk.length;
      }


      const result = new Uint8Array(totalLength);
      let offset = 0;


      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;

    } catch (error) {
      console.error('IPFS download error:', error);
      throw new Error('Failed to download file from IPFS');
    }
  }

  getIPFSUrl(cid: string): string {
    return `http://localhost:8080/ipfs/${cid}`;
  }
}