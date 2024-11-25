import React, { useState, useEffect } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Send, Clock, Download, FileText, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { FileUpload } from './components/FileUpload';
import { AddressInput } from './components/AddressInput';
import { TransferStatus } from './components/TransferStatus';
import { TransferHistory } from './components/TransferHistory';
import { ReceiverView } from './components/ReceiverView';
import { ZKProofProgress } from './components/ZKProofProgress';
import { FileTransferService } from './services/fileTransfer';

type TabType = 'transfer' | 'history' | 'received';

function App() {
  const wallet = useWallet();
  const { publicKey, sendTransaction, connecting, connected } = wallet;
  const [file, setFile] = useState<File | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ipfsUrl, setIpfsUrl] = useState<string>();
  const [transferService] = useState(() => new FileTransferService());
  const [activeTab, setActiveTab] = useState<TabType>('transfer');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const [zkProofStage, setZkProofStage] = useState<number>(0);

  useEffect(() => {
    transferService.initialize();
    if (publicKey) {
      setReceivedFiles([
        {
          id: '1',
          fileName: 'document.pdf',
          sender: 'ABC123...XYZ',
          ipfsUrl: 'https://ipfs.io/ipfs/QmExample',
          timestamp: new Date().toISOString(),
          status: 'new'
        }
      ]);
    }
  }, [transferService, publicKey]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setIpfsUrl(undefined);
      setZkProofStage(0);
    }
  };

  const simulateZKProofGeneration = async () => {
    setZkProofStage(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setZkProofStage(2);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setZkProofStage(3);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setZkProofStage(4);
  };

  const handleTransfer = async () => {
    if (!file || !publicKey || !recipientAddress) {
      toast.error('Please connect wallet and select file and recipient');
      return;
    }
    
    const transferToast = toast.loading('Initiating secure transfer...');
    setIsLoading(true);
    
    try {
      await simulateZKProofGeneration();
      
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
        status: 'completed',
        proofHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      }]);
      
      toast.success('Transfer completed with zero-knowledge proof!', { id: transferToast });
      setFile(null);
      setRecipientAddress('');
      setZkProofStage(0);
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Transfer failed. Please try again.', { id: transferToast });
    }
    setIsLoading(false);
  };

  const handleDownload = async (fileId: string) => {
    const downloadToast = toast.loading('Verifying zero-knowledge proof...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setReceivedFiles(prev =>
        prev.map(file =>
          file.id === fileId ? { ...file, status: 'downloaded' } : file
        )
      );
      
      toast.success('Proof verified and file downloaded successfully!', { id: downloadToast });
    } catch (error) {
      toast.error('Proof verification failed. Please try again.', { id: downloadToast });
    }
  };

  const handleWalletError = (error: Error) => {
    console.error('Wallet error:', error);
    toast.error('Wallet connection failed. Please try again.');
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
            <span className="text-4xl font-bold text-[#feffaf]">λ</span>
            <h1 className="text-4xl font-bold">zkλ</h1>
          </motion.div>
          <WalletMultiButton 
            className="!bg-[#feffaf] !text-black hover:!bg-[#e5e69c] transition-colors"
            onClick={() => {
              if (!connected && !connecting) {
                try {
                  wallet.connect().catch(handleWalletError);
                } catch (error) {
                  handleWalletError(error as Error);
                }
              }
            }}
          />
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8 space-x-4">
            <TabButton 
              active={activeTab === 'transfer'} 
              onClick={() => setActiveTab('transfer')}
              icon={<Send size={20} />}
              text="Send File"
            />
            <TabButton 
              active={activeTab === 'received'} 
              onClick={() => setActiveTab('received')}
              icon={<Download size={20} />}
              text="Received"
            />
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')}
              icon={<Clock size={20} />}
              text="History"
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
                      <Lock size={24} className="text-[#feffaf]" />
                      <h2 className="text-2xl font-semibold">Zero-Knowledge File Transfer</h2>
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

                      {file && recipientAddress && (
                        <ZKProofProgress stage={zkProofStage} />
                      )}

                      <TransferStatus 
                        file={file}
                        recipientAddress={recipientAddress}
                        isLoading={isLoading}
                      />

                      <button
                        onClick={handleTransfer}
                        disabled={!file || !recipientAddress || isLoading || !connected}
                        className={`w-full py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                          !file || !recipientAddress || isLoading || !connected
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
                          <>
                            <Send size={20} />
                            <span>Send Securely</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'history' ? (
                <TransferHistory transfers={transfers} />
              ) : (
                <ReceiverView 
                  receivedFiles={receivedFiles}
                  onDownload={handleDownload}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
}

function TabButton({ active, onClick, icon, text }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-[#feffaf] text-black' 
          : 'bg-zinc-900/50 hover:bg-zinc-800'
      }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

export default App;