import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransferStatusProps {
  file: File | null;
  recipientAddress: string;
  isLoading: boolean;
}

export function TransferStatus({ file, recipientAddress, isLoading }: TransferStatusProps) {
  const checks = [
    {
      label: 'File Selected',
      passed: !!file,
    },
    {
      label: 'Valid Recipient Address',
      passed: recipientAddress.length === 44,
    },
    {
      label: 'Ready for Transfer',
      passed: !!file && recipientAddress.length === 44 && !isLoading,
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
          className={`flex items-center justify-between p-3 rounded-lg ${
            check.passed ? 'bg-green-900/20' : 'bg-zinc-800/50'
          }`}
        >
          <span className="text-sm">{check.label}</span>
          {check.passed ? (
            <CheckCircle size={18} className="text-green-400" />
          ) : (
            <XCircle size={18} className="text-zinc-500" />
          )}
        </motion.div>
      ))}
    </div>
  );
}