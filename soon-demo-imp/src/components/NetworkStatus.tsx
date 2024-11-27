import React from 'react';
import { motion } from 'framer-motion';
import { Network, Loader2, AlertCircle } from 'lucide-react';

interface NetworkStatusProps {
  isConnected: boolean;
  isOnSoonNetwork: boolean;
  isLoading: boolean;
  error?: string | null;
}

export function NetworkStatus({ 
  isConnected, 
  isOnSoonNetwork, 
  isLoading,
  error 
}: NetworkStatusProps) {
  if (!isConnected) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
        error
          ? 'bg-red-500/10 text-red-500'
          : isOnSoonNetwork 
            ? 'bg-[#feffaf]/10 text-[#feffaf]' 
            : 'bg-yellow-500/10 text-yellow-500'
      }`}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : error ? (
        <AlertCircle size={16} />
      ) : (
        <Network size={16} />
      )}
      <span className="text-sm font-medium">
        {isLoading 
          ? 'Connecting...' 
          : error
          ? 'Network Error'
          : isOnSoonNetwork 
          ? 'SOON Testnet' 
          : 'Connecting to SOON'}
      </span>
    </motion.div>
  );
}