import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Train, Shield, History, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { FileUpload } from './components/FileUpload';
import { AddressInput } from './components/AddressInput';
import { TransferStatus } from './components/TransferStatus';
import { TransferHistory } from './components/TransferHistory';
import { FileTransferService } from './services/fileTransfer';

interface Transfer {
  id: string;
  fileName: string;
  recipient: string;
  ipfsUrl: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

const App: React.FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState<string>();
  const [transferService] = useState(() => new FileTransferService());
  const [activeTab, setActiveTab] = useState<'transfer' | 'history'>('transfer');
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    transferService.initialize();
  }, [transferService]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setIpfsUrl(undefined);
    }
  };

  const handleTransfer = async () => {
    if (!file || !publicKey || !recipientAddress) return;
    
    const transferToast = toast.loading('Initiating secure transfer...');
    setIsLoading(true);
    
    try {
      const result = await transferService.transferFile(
        file,
        publicKey,
        recipientAddress,
        sendTransaction
      );
      
      setIpfsUrl(result.ipfsUrl);
      setTransfers(prev => [...prev, {
        id: result.signature,
        fileName: file.name,
        recipient: recipientAddress,
        ipfsUrl: result.ipfsUrl,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }]);
      
      toast.success('Transfer completed successfully!', { id: transferToast });
      setFile(null);
      setRecipientAddress('');
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Transfer failed. Please try again.', { id: transferToast });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-[#feffaf] font-league-spartan">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-16">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Train className="animate-pulse" size={32} />
            <h1 className="text-4xl font-bold">ZK-Lokomotive SOON</h1>
          </motion.div>
          <WalletMultiButton className="!bg-[#feffaf] !text-black hover:!bg-[#e5e69c] transition-colors" />
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8 space-x-4">
            <TabButton 
              active={activeTab === 'transfer'} 
              onClick={() => setActiveTab('transfer')}
              icon={<Shield size={20} />}
              text="New Transfer"
            />
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')}
              icon={<History size={20} />}
              text="Transfer History"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'transfer' ? (
                <div className="bg-zinc-900/50 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-zinc-800">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 mb-8">
                      <Shield className="text-[#feffaf]" size={24} />
                      <h2 className="text-2xl font-semibold">Private File Transfer</h2>
                    </div>

                    <div className="space-y-6">
                      <FileUpload 
                        file={file} 
                        onFileChange={handleFileChange}
                        ipfsUrl={ipfsUrl}
                      />
                      
                      <AddressInput 
                        value={recipientAddress} 
                        onChange={setRecipientAddress} 
                      />

                      <TransferStatus 
                        file={file}
                        recipientAddress={recipientAddress}
                        isLoading={isLoading}
                      />

                      <button
                        onClick={handleTransfer}
                        disabled={!file || !recipientAddress || isLoading}
                        className={`w-full py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                          !file || !recipientAddress || isLoading
                            ? 'bg-zinc-700 cursor-not-allowed'
                            : 'bg-[#feffaf] text-black hover:bg-[#e5e69c]'
                        }`}
                        type="button"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight size={20} />
                            <span>Transfer File Securely</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <TransferHistory transfers={transfers} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, text }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-[#feffaf] text-black' 
          : 'bg-zinc-900/50 hover:bg-zinc-800'
      }`}
      type="button"
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};

export default App;