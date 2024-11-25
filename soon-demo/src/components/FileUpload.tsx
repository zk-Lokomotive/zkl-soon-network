import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  ipfsUrl?: string;
}

export function FileUpload({ file, onFileChange, ipfsUrl }: FileUploadProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="file"
          onChange={onFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center space-x-2 w-full py-4 border-2 border-dashed border-[#feffaf] rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
        >
          <Upload size={20} />
          <span>{file ? file.name : 'Choose a file to transfer'}</span>
        </label>
      </div>
      
      {ipfsUrl && (
        <div className="p-4 bg-zinc-800 rounded-lg">
          <p className="text-sm mb-2">File uploaded to IPFS:</p>
          <a 
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#feffaf] hover:underline text-sm break-all"
          >
            {ipfsUrl}
          </a>
        </div>
      )}
    </div>
  );
}