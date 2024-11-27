import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { Buffer } from 'buffer';
import { NetworkManager } from './services/networkManager';
import './utils/ws-polyfill';

type ProcessVersions = {
  node: string;
  v8: string;
  uv: string;
  zlib: string;
  brotli: string;
  ares: string;
  modules: string;
  nghttp2: string;
  napi: string;
  llhttp: string;
  openssl: string;
  cldr: string;
  icu: string;
  tz: string;
  unicode: string;
  http_parser: string;
};

type ProcessFeatures = {
  inspector: boolean;
  debug: boolean;
  uv: boolean;
  ipv6: boolean;
  tls_alpn: boolean;
  tls_sni: boolean;
  tls_ocsp: boolean;
  tls: boolean;
};

type ProcessRelease = {
  name: string;
  sourceUrl: string;
  headersUrl: string;
  libUrl: string;
  lts?: string;
};

declare global {
  interface Window {
    process: any;
    Buffer: typeof Buffer;
  }
}

// Polyfills
window.Buffer = Buffer;

const processPolyfill = {
  env: {} as Record<string, string>,
  version: '1.0.0',
  browser: true,
  nextTick: function(fn: () => void) {
    setTimeout(fn, 0);
  },
  versions: {
    node: '16.0.0',
    v8: '9.0.0',
    uv: '1.0.0',
    zlib: '1.0.0',
    brotli: '1.0.0',
    ares: '1.0.0',
    modules: '1.0.0',
    nghttp2: '1.0.0',
    napi: '1.0.0',
    llhttp: '1.0.0',
    openssl: '1.0.0',
    cldr: '1.0.0',
    icu: '1.0.0',
    tz: '1.0.0',
    unicode: '1.0.0',
    http_parser: '1.0.0'
  } as ProcessVersions,
  platform: 'darwin',
  release: {
    name: 'node',
    sourceUrl: '',
    headersUrl: '',
    libUrl: '',
    lts: undefined
  } as ProcessRelease,
  features: {
    inspector: false,
    debug: false,
    uv: false,
    ipv6: false,
    tls_alpn: false,
    tls_sni: false,
    tls_ocsp: false,
    tls: false
  } as ProcessFeatures,
  hrtime(start?: [number, number]): [number, number] {
    return [0, 0];
  },
  kill(_pid: number, _signal?: string): boolean {
    return true;
  },
  uptime(): number {
    return 0;
  },
  umask(_mask?: string | number): number {
    return 0;
  },
  memoryUsage(): { 
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  } {
    return {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0
    };
  }
};

// Initialize process polyfill
window.process = processPolyfill;

// Initialize app
const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const root = createRoot(container);

// Initialize network manager
NetworkManager.getInstance();

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);