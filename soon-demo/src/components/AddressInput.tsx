import React from 'react';
import { User } from 'lucide-react';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function AddressInput({ value, onChange }: AddressInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm">Recipient's Solflare Address</label>
      <div className="relative">
        <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#feffaf]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter recipient's address"
          className="w-full py-3 px-10 bg-zinc-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#feffaf] transition-all"
        />
      </div>
    </div>
  );
}