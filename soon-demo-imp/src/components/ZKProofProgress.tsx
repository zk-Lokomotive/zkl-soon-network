import React from 'react';
import { motion } from 'framer-motion';
import { KeyRound, FileKey, ShieldCheck, ArrowRight } from 'lucide-react';

interface ZKProofProgressProps {
  stage: number; // 0: Not started, 1: Witness, 2: Proof, 3: Verify, 4: Complete
}

export function ZKProofProgress({ stage }: ZKProofProgressProps) {
  const stages = [
    {
      icon: KeyRound,
      title: 'Generate Witness',
      description: 'Creating arithmetic circuit...',
    },
    {
      icon: FileKey,
      title: 'Compute Proof',
      description: 'Applying Groth16 protocol...',
    },
    {
      icon: ShieldCheck,
      title: 'Verify Proof',
      description: 'Checking validity on-chain...',
    },
    {
      icon: ArrowRight,
      title: 'Ready',
      description: 'Zero-knowledge proof prepared',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-[#feffaf]">Zero-Knowledge Proof Generation</div>
      <div className="grid grid-cols-4 gap-4">
        {stages.map((s, index) => {
          const Icon = s.icon;
          const isActive = stage > index;
          const isCurrent = stage === index + 1;

          return (
            <motion.div
              key={s.title}
              className={`relative p-4 rounded-lg border ${
                isActive 
                  ? 'border-[#feffaf] bg-[#feffaf]/10' 
                  : isCurrent
                  ? 'border-[#feffaf]/50 bg-[#feffaf]/5 animate-pulse'
                  : 'border-zinc-800 bg-zinc-900/30'
              }`}
              initial={false}
              animate={{
                scale: isCurrent ? 1.02 : 1,
                opacity: stage === 0 ? 0.5 : 1,
              }}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <Icon 
                  size={20} 
                  className={isActive ? 'text-[#feffaf]' : 'text-zinc-500'} 
                />
                <div className="text-sm font-medium">{s.title}</div>
                {isCurrent && (
                  <div className="text-xs text-zinc-400">{s.description}</div>
                )}
              </div>
              
              {index < stages.length - 1 && (
                <div 
                  className={`absolute right-0 top-1/2 w-8 h-px -mr-4 ${
                    isActive ? 'bg-[#feffaf]' : 'bg-zinc-800'
                  }`}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}