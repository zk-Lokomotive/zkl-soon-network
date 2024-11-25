import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { FileTransferMetadata } from '../services/fileTransfer';
import { formatFileSize } from '../utils/format';

interface ReceiverViewProps {
  receivedFiles: FileTransferMetadata[];
  onDownload: (ipfsHash: string) => Promise<void>;
}

export function ReceiverView({ receivedFiles, onDownload }: ReceiverViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <Download size={24} className="text-[#feffaf]" />
        <h2 className="text-2xl font-semibold">Received Files</h2>
      </div>

      {receivedFiles.length === 0 ? (
        <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-8 text-center">
          <p className="text-zinc-400">No files received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {receivedFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-6 border border-zinc-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <FileText size={20} className="text-[#feffaf]" />
                  <div>
                    <h3 className="font-semibold">{file.fileName}</h3>
                    <p className="text-sm text-zinc-400">
                      {formatFileSize(file.fileSize)} • {file.fileType || 'Unknown type'}
                    </p>
                    <p className="text-sm text-zinc-400">
                      From: {file.sender.slice(0, 4)}...{file.sender.slice(-4)}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {new Date(file.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => onDownload(file.ipfsHash)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#feffaf] text-black rounded-lg hover:bg-[#e5e69c] transition-colors"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800">
                <a
                  href={`https://ipfs.io/ipfs/${file.ipfsHash}`}
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
      )}
    </div>
  );
}