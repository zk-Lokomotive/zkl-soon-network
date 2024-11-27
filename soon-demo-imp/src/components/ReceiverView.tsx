// import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, Download } from 'lucide-react';
import { FileTransferMetadata } from '../services/fileTransfer';
import { formatFileSize } from '../utils/format';
import { IPFSService } from '../services/ipfs';
import { toast } from 'react-hot-toast';

interface ReceiverViewProps {
  receivedFiles: FileTransferMetadata[];
}

export function ReceiverView({ receivedFiles }: ReceiverViewProps) {
  const handleDownload = async (file: FileTransferMetadata) => {
    try {
      const ipfsService = IPFSService.getInstance();
      const data = await ipfsService.downloadFile(file.ipfsCid);
      
      // Dosyayı indir
      const blob = new Blob([data], { type: file.fileType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Dosya indirilemedi');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-6">Received Files</h2>

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
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#feffaf] text-black rounded-lg hover:bg-[#e5e69c] transition-colors"
                  >
                    <Download size={16} />
                    <span>İndir</span>
                  </button>
                  <a
                    href={file.ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-[#feffaf] text-black rounded-lg hover:bg-[#e5e69c] transition-colors"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800">
                <a
                  href={file.ipfsUrl}
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