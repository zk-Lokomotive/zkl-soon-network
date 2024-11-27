import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      'stream': 'stream-browserify',
      'buffer': 'buffer',
      'process': 'process/browser',
      'zlib': 'browserify-zlib',
      'util': 'util',
      'rpc-websockets': resolve(__dirname, './src/utils/ws-polyfill.ts'),
      'rpc-websockets/dist/lib/client': resolve(__dirname, './src/utils/ws-client.ts'),
      'rpc-websockets/dist/lib/client/websocket.browser': resolve(__dirname, './src/utils/ws-browser.ts'),
      'ws': resolve(__dirname, './src/utils/ws-polyfill.ts')
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    include: [
      '@solana/web3.js',
      'buffer',
      'process',
      'events',
      'stream-browserify',
      '@coral-xyz/anchor'
    ]
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: ['rpc-websockets', 'ws'],
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'framer-motion',
            '@solana/web3.js',
            'buffer',
            'process'
          ]
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
});