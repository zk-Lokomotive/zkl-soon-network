import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransferStatusProps {
  file: File | null;
  recipientAddress: string;
  isLoading: boolean;
  isWalletConnected: boolean;
  isOnSoonNetwork: boolean;
}

export function TransferStatus({ 
  file, 
  recipientAddress, 
  isLoading,
  isWalletConnected,
  isOnSoonNetwork
}: TransferStatusProps) {
  const checks = [
    {
      label: 'Wallet Connected',
      passed: isWalletConnected,
      loading: false
    },
    {
      label: 'SOON Network Connected',
      passed: isOnSoonNetwork,
      loading: false
    },
    {
      label: 'File Selected',
      passed: !!file,
      loading: false
    },
    {
      label: 'Valid Recipient Address',
      passed: recipientAddress.length === 44,
      loading: false
    },
    {
      label: 'Ready for Transfer',
      passed: isWalletConnected && 
              isOnSoonNetwork && 
              !!file && 
              recipientAddress.length === 44 && 
              !isLoading,
      loading: isLoading
    },
  ];

  return (
    <div className="space-y-2">
      {checks.map((check, index) => (
        <motion.div
          key={check.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
            check.passed ? 'bg-[#feffaf]/10' : 'bg-zinc-800/30'
          }`}
        >
          <span className="text-sm">{check.label}</span>
          {check.loading ? (
            <Loader2 size={18} className="text-[#feffaf] animate-spin" />
          ) : check.passed ? (
            <CheckCircle size={18} className="text-[#feffaf]" />
          ) : (
            <XCircle size={18} className="text-zinc-500" />
          )}
        </motion.div>
      ))}
    </div>
  );
}