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

  async updateFile(oldCid: string, newContent: File): Promise<{
    newCid: string;
    oldCid: string;
  }> {
    try {
      // Yeni dosyayı yükle
      const newCid = await this.uploadFile(newContent);
      
      // Versiyon bilgisini kaydet
      await this.storeVersion({
        currentCid: newCid,
        previousCid: oldCid,
        timestamp: new Date().toISOString()
      });
      
      // Eski ve yeni CID'leri döndür
      return {
        newCid,
        oldCid
      };
    } catch (error) {
      console.error('IPFS güncelleme hatası:', error);
      throw new Error('Dosya güncellenemedi');
    }
  }

  // Dosya versiyonlarını takip etmek için
  private async storeVersion(metadata: {
    currentCid: string;
    previousCid: string;
    timestamp: string;
  }): Promise<void> {
    try {
      const versions = this.getVersionHistory(metadata.currentCid) || [];
      versions.push(metadata);
      localStorage.setItem(`versions_${metadata.currentCid}`, JSON.stringify(versions));
    } catch (error) {
      console.error('Versiyon kayıt hatası:', error);
    }
  }

  public getVersionHistory(cid: string): Array<{
    currentCid: string;
    previousCid: string;
    timestamp: string;
  }> {
    try {
      const versions = localStorage.getItem(`versions_${cid}`);
      return versions ? JSON.parse(versions) : [];
    } catch {
      return [];
    }
  }
}