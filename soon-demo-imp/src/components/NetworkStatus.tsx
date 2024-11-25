import React from 'react';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';

interface NetworkStatusProps {
  isConnected: boolean;
  isOnSoonNetwork: boolean;
  isLoading: boolean;
}

export function NetworkStatus({ isConnected, isOnSoonNetwork, isLoading }: NetworkStatusProps) {
  if (!isConnected) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
        isOnSoonNetwork 
          ? 'bg-[#feffaf]/10 text-[#feffaf]' 
          : 'bg-red-500/10 text-red-500'
      }`}
    >
      <Network size={16} className={isLoading ? 'animate-pulse' : ''} />
      <span className="text-sm font-medium">
        {isLoading 
          ? 'Switching...' 
          : isOnSoonNetwork 
          ? 'SOON Network' 
          : 'Wrong Network'}
      </span>
    </motion.div>
  );
}