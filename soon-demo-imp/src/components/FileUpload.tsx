import React, { useEffect, useState } from 'react';
import { Upload, File, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { BackpackConnector } from '../lib/BackpackConnector';
import { Connection, PublicKey } from '@solana/web3.js';

interface FileUploadProps {
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  ipfsUrl?: string;
  isUploading?: boolean;
}

export function FileUpload({
  file,
  onFileChange,
  ipfsUrl,
  isUploading = false
}: FileUploadProps) {
  const [backpackConnector, setBackpackConnector] = useState<BackpackConnector | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [walletAddress, setWalletAddress] = useState<PublicKey | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      setConnecting(true);
      try {
        const connector = new BackpackConnector('https://rpc.testnet.soo.network/rpc');
        const publicKey = await connector.connect();
        
        if (publicKey) {
          setBackpackConnector(connector);
          setConnection(connector.getConnection());
          setWalletAddress(publicKey);
        }
      } catch (error) {
        console.error('Failed to initialize Wallet:', error);
      } finally {
        setConnecting(false);
      }
    };

    initializeWallet();
  }, []);

  const { connected } = useWallet();


  useEffect(() => {
    return () => {
      backpackConnector?.disconnect();
    };
  }, [backpackConnector]);

  if (walletAddress) {
    console.log("Wallet Address:", walletAddress.toString());
  }

  if (connecting) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={24} className="text-[#feffaf] animate-spin mr-2" />
        <span>Connecting to wallet...</span>
      </div>
    );
  }

  if (!backpackConnector || !connection) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={24} className="text-[#feffaf] animate-spin mr-2" />
        <span>Loading wallet connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="file"
          onChange={onFileChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading || !connected}
        />
        <motion.label
          htmlFor="file-upload"
          className={`flex items-center justify-center space-x-2 w-full py-8 border-2 border-dashed rounded-lg transition-all ${
            !connected
              ? 'border-zinc-700 bg-zinc-800/30 cursor-not-allowed'
              : isUploading
              ? 'border-[#feffaf] bg-[#feffaf]/10 cursor-wait'
              : file
              ? 'border-[#feffaf] bg-[#feffaf]/10 cursor-pointer'
              : 'border-zinc-700 hover:border-[#feffaf] hover:bg-zinc-800/50 cursor-pointer'
          }`}
          whileHover={!isUploading && connected ? { scale: 1.01 } : {}}
          whileTap={!isUploading && connected ? { scale: 0.99 } : {}}
        >
          {!connected ? (
            <span className="text-zinc-500">Connect wallet to upload files</span>
          ) : isUploading ? (
            <>
              <Loader2 size={20} className="text-[#feffaf] animate-spin" />
              <span>Uploading file...</span>
            </>
          ) : file ? (
            <>
              <File size={20} className="text-[#feffaf]" />
              <div className="flex flex-col">
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-zinc-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>Choose a file to transfer</span>
            </>
          )}
        </motion.label>
      </div>
      {ipfsUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#feffaf]/10 rounded-lg border border-[#feffaf]/20"
        >
          <p className="text-sm mb-2 text-[#feffaf]">File uploaded to IPFS:</p>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#feffaf] hover:underline text-sm break-all"
          >
            {ipfsUrl}
          </a>
        </motion.div>
      )}
    </div>
  );
}