import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: [
        'buffer', 
        'process', 
        'util', 
        'stream', 
        'events', 
        'crypto',
        'path',
        'fs',
        'http',
        'https',
        'os',
        'assert'
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true,
    })
  ],
  define: {
    'global': 'globalThis',
    'process.env': process.env,
    '__filename': JSON.stringify(''),
    '__dirname': JSON.stringify('')
  },
  resolve: {
    alias: {
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'assert': 'assert',
      'http': 'stream-http',
      'https': 'https-browserify',
      'os': 'os-browserify/browser',
      'events': 'eventemitter3',
      'rpc-websockets': path.resolve(__dirname, 'node_modules/rpc-websockets'),
      'ws': path.resolve(__dirname, 'node_modules/ws/browser')
    },
    dedupe: ['@solana/web3.js', 'bn.js', 'buffer']
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: { bigint: true },
      define: {
        global: 'globalThis'
      }
    },
    include: [
      '@solana/web3.js',
      'eventemitter3',
      'rpc-websockets',
      'bn.js',
      'buffer'
    ],
    exclude: ['ws']
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['ws'],
      output: {
        manualChunks: {
          'solana-web3': ['@solana/web3.js'],
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true
    }
  }
});