import React, { FC } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Loader2, ChevronDown, LogOut } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export const WalletButton: FC = () => {
  const { walletAddress, connectWallet, disconnectWallet, connecting } = useWallet();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      {walletAddress ? (
        <div className="relative">
          <button
            onClick={disconnectWallet}
            className="flex items-center space-x-2 bg-[#feffaf] text-black px-4 py-2 rounded-lg hover:bg-[#e5e69c] transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>{walletAddress.toBase58().slice(0, 4)}...{walletAddress.toBase58().slice(-4)}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className={`flex items-center space-x-2 bg-[#feffaf] text-black px-4 py-2 rounded-lg hover:bg-[#e5e69c] transition-all ${
            connecting ? 'opacity-80 cursor-wait' : ''
          }`}
          disabled={connecting}
        >
          {connecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      )}
    </motion.div>
  );
};