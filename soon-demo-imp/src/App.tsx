import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from './components/FileUpload';
import { AddressInput } from './components/AddressInput';
import { TransferStatus } from './components/TransferStatus';
import { TransferHistory } from './components/TransferHistory';
import { FileTransferService, FileTransferMetadata } from './services/fileTransfer';
import { ReceiverView } from './components/ReceiverView';
import { useSoonNetwork } from './hooks/useSoonNetwork';
import { NetworkStatus } from './components/NetworkStatus';
import { ZKProofProgress } from './components/ZKProofProgress';
import { WalletButton } from './components/WalletButton';
import { useWallet, WalletProvider } from './contexts/WalletContext';

function AppContent() {
  const { walletAddress, connected, wallet } = useWallet();
  const { isOnSoonNetwork, isLoading: isNetworkSwitching } = useSoonNetwork();

  const [file, setFile] = useState<File | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState<string>();
  const [transferService] = useState(() => new FileTransferService());
  const [activeTab, setActiveTab] = useState<'transfer' | 'history' | 'received'>('transfer');
  const [transfers, setTransfers] = useState<FileTransferMetadata[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<FileTransferMetadata[]>([]);
  const [zkProofStage, setZkProofStage] = useState(0);

  useEffect(() => {
    if (connected && walletAddress && isOnSoonNetwork) {
      loadTransferHistory();
    }
  }, [connected, walletAddress, isOnSoonNetwork]);

  const loadTransferHistory = () => {
    if (!walletAddress) return;
    const received = transferService.getReceivedFiles(walletAddress.toBase58());
    setReceivedFiles(received);
    const sent = transferService.getSentFiles(walletAddress.toBase58());
    setTransfers(sent);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setIpfsUrl(undefined);
      setZkProofStage(0);
    }
  };

  const handleTransfer = async () => {
    if (!file || !walletAddress || !recipientAddress || !wallet) {
      toast.error('Please ensure wallet is connected and all fields are filled');
      return;
    }

    if (!isOnSoonNetwork) {
      toast.error('Please connect to SOON Network first');
      return;
    }

    setIsLoading(true);
    try {
      const { signature, metadata } = await transferService.transferFile(
        file,
        wallet,
        recipientAddress
      );

      console.log('Transfer Signature:', signature);

      // Handle the result
      setIpfsUrl(metadata.ipfsUrl);
      loadTransferHistory();
      setFile(null);
      setRecipientAddress('');
      setZkProofStage(0);
      toast.success('Transfer completed successfully!');
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(error instanceof Error ? error.message : 'Transfer failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 rounded-lg transition-all ${
        activeTab === tab 
          ? 'bg-[#feffaf] text-black' 
          : 'bg-zinc-900/50 hover:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  );


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
            <h1 className="text-4xl font-bold">zkλ</h1>
          </motion.div>
          <div className="flex items-center space-x-4">
            <NetworkStatus 
              isConnected={connected} 
              isOnSoonNetwork={isOnSoonNetwork} 
              isLoading={isNetworkSwitching}
            />
            <WalletButton />
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8 space-x-4">
            <TabButton tab="transfer" label="New Transfer" />
            <TabButton tab="received" label="Received Files" />
            <TabButton tab="history" label="Transfer History" />
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
                    <FileUpload 
                      file={file} 
                      onFileChange={handleFileChange}
                      ipfsUrl={ipfsUrl}
                      isUploading={isLoading}
                    />
                    
                    <AddressInput 
                      value={recipientAddress} 
                      onChange={setRecipientAddress} 
                    />

                    {zkProofStage > 0 && (
                      <ZKProofProgress stage={zkProofStage} />
                    )}

                    <TransferStatus 
                      file={file}
                      recipientAddress={recipientAddress}
                      isLoading={isLoading}
                      isWalletConnected={connected}
                      isOnSoonNetwork={isOnSoonNetwork}
                    />

                    <button
                      onClick={handleTransfer}
                      disabled={!file || !recipientAddress || isLoading || !isOnSoonNetwork}
                      className={`w-full py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                        !file || !recipientAddress || isLoading || !isOnSoonNetwork
                          ? 'bg-zinc-700 cursor-not-allowed'
                          : 'bg-[#feffaf] text-black hover:bg-[#e5e69c]'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Transfer File Securely</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : activeTab === 'received' ? (
                <ReceiverView receivedFiles={receivedFiles} />
              ) : (
                <TransferHistory transfers={transfers} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;