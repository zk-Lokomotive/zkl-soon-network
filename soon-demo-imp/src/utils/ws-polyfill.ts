// WebSocket polyfill for browser environment
export class WebSocket extends globalThis.WebSocket {
  constructor(url: string, protocols?: string | string[]) {
    super(url, protocols);
  }
}

// RPC specific types
interface RPCNotification {
  jsonrpc: '2.0';
  method: string;
  params: any;
}

interface RPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any[];
  id?: string | number;
}

interface RPCResponseSuccess {
  jsonrpc: '2.0';
  result: any;
  id: string | number;
}

interface RPCResponseError {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
  };
  id: string | number;
}

type RPCMessage = RPCNotification | RPCResponseSuccess | RPCResponseError;

export class CommonClient {
  private ws: WebSocketClient;
  private requestId: number = 1;
  private requests: Map<number | string, { resolve: Function; reject: Function }> = new Map();
  private subscriptions: Map<string, Function[]> = new Map();
  
  constructor(address: string, options: any = {}) {
    this.ws = new WebSocketClient(address, options);
    
    // Handle incoming messages
    this.ws.on('message', (data: any) => {
      try {
        const message: RPCMessage = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle subscription notifications
        if (this.isNotification(message)) {
          if (message.method.startsWith('subscription')) {
            const subscribers = this.subscriptions.get(message.method);
            if (subscribers) {
              subscribers.forEach(callback => callback(message.params));
            }
          }
          return;
        }

        // Handle RPC responses
        if ('id' in message) {
          const handler = this.requests.get(message.id);
          if (handler) {
            if ('error' in message) {
              handler.reject(message.error);
            } else {
              handler.resolve(message.result);
            }
            this.requests.delete(message.id);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  private isNotification(message: RPCMessage): message is RPCNotification {
    return 'method' in message;
  }

  call(method: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const request: RPCRequest = {
        jsonrpc: '2.0',
        method,
        params: params || [],
        id
      };

      this.requests.set(id, { resolve, reject });
      this.ws.send(request);
    });
  }

  notify(method: string, params?: any[]): void {
    const request: RPCRequest = {
      jsonrpc: '2.0',
      method,
      params: params || []
    };
    this.ws.send(request);
  }

  on(event: string, callback: Function): void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  off(event: string, callback: Function): void {
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  close(): void {
    this.ws.close();
    this.requests.clear();
    this.subscriptions.clear();
  }
}

interface WebSocketClientOptions {
  maxReconnectAttempts?: number;
  reconnectTimeout?: number;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketClientOptions;
  private callbacks: { [key: string]: ((data: any) => void)[] } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectTimeout: number;

  constructor(url: string, options: WebSocketClientOptions = {}) {
    this.url = url;
    this.options = options;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.reconnectTimeout = options.reconnectTimeout ?? 1000;
    this.connect();
  }

  connect() {
    if (!this.ws) {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit('open');
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch {
            this.emit('message', event.data);
          }
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          this.attemptReconnect();
        };

        this.ws.onclose = () => {
          this.emit('close');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.attemptReconnect();
      }
    }
    return this;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.ws = null;
        this.connect();
      }, this.reconnectTimeout * this.reconnectAttempts);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return this;
  }

  off(event: string, callback: (data: any) => void) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
    return this;
  }

  emit(event: string, data?: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
    return this;
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
    return this;
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    return this;
  }

  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}

// Export aliases to match rpc-websockets interface
export { WebSocketClient as w3cwebsocket };
export { WebSocketClient as client };
export { CommonClient as RpcWebSocketCommonClient };

// Helper function to create new RPC client
export const createRpc = (url: string, options?: WebSocketClientOptions) => new CommonClient(url, options);

export default WebSocketClient;