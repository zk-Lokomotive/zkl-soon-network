import React from 'react';
import { Upload, File } from 'lucide-react';

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
          className={`flex items-center justify-center space-x-2 w-full py-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            file 
              ? 'border-[#feffaf] bg-[#feffaf]/10' 
              : 'border-zinc-700 hover:border-[#feffaf] hover:bg-zinc-800/50'
          }`}
        >
          {file ? (
            <>
              <File size={20} className="text-[#feffaf]" />
              <div className="flex flex-col">
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-zinc-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>Choose a file to transfer</span>
            </>
          )}
        </label>
      </div>
      
      {ipfsUrl && (
        <div className="p-4 bg-[#feffaf]/10 rounded-lg border border-[#feffaf]/20">
          <p className="text-sm mb-2 text-[#feffaf]">File uploaded to IPFS:</p>
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