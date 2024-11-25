// import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, KeyRound, Download } from 'lucide-react';
import { FileTransferMetadata } from '../services/fileTransfer';
import { formatFileSize } from '../utils/format.ts';

interface TransferHistoryProps {
  transfers: FileTransferMetadata[];
  onDownload?: (ipfsHash: string) => Promise<void>;
}
// interface FileTransferMetadata {
// }
export function TransferHistory({ transfers, onDownload }: TransferHistoryProps) {
  if (transfers.length === 0) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-8 text-center">
        <p className="text-zinc-400">No transfers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transfers.map((transfer, index) => (
        <motion.div
          key={transfer.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-6 border border-zinc-800"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <FileText size={20} className="text-[#feffaf]" />
              <div>
                <h3 className="font-semibold">{transfer.fileName}</h3>
                <p className="text-sm text-zinc-400">
                  {formatFileSize(transfer.fileSize)} • {transfer.fileType || 'Unknown type'}
                </p>
                <p className="text-sm text-zinc-400">
                  To: {transfer.recipient.slice(0, 4)}...{transfer.recipient.slice(-4)}
                </p>
                <p className="text-sm text-zinc-400">
                  {new Date(transfer.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            
            {onDownload && (
              <button
                onClick={() => onDownload(transfer.ipfsHash)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#feffaf] text-black rounded-lg hover:bg-[#e5e69c] transition-colors"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-zinc-400">
              <KeyRound size={14} className="text-[#feffaf]" />
              <span>ZK Proof Hash:</span>
              <code className="font-mono text-xs">{transfer.proofHash}</code>
            </div>
            
            <a
              href={`https://ipfs.io/ipfs/${transfer.ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-[#feffaf] hover:underline text-sm"
            >
              <span>View on IPFS</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
}