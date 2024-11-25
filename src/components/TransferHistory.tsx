import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, CheckCircle } from 'lucide-react';

interface Transfer {
  id: string;
  fileName: string;
  recipient: string;
  ipfsUrl: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface TransferHistoryProps {
  transfers: Transfer[];
}

export function TransferHistory({ transfers }: TransferHistoryProps) {
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
                  {new Date(transfer.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-sm text-green-400">Completed</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                Recipient: {transfer.recipient.slice(0, 4)}...{transfer.recipient.slice(-4)}
              </div>
              <a
                href={transfer.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-[#feffaf] hover:underline text-sm"
              >
                <span>View on IPFS</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}