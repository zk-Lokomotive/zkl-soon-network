// // src/services/backpackWallet.ts

// import { Connection, Transaction, VersionedTransaction, SendOptions, PublicKey } from '@solana/web3.js';
// import { encode as bs58Encode, decode as bs58Decode } from 'bs58';
// import { box, randomBytes } from 'tweetnacl';

// interface BackpackSession {
//   publicKey: string;
//   session: string;
// }

// interface BackpackProvider {
//   signTransaction?: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
//   signAllTransactions?: (transactions: (Transaction | VersionedTransaction)[]) => Promise<(Transaction | VersionedTransaction)[]>;
//   signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
//   sendTransaction?: (transaction: Transaction | VersionedTransaction, connection: Connection, options?: SendOptions) => Promise<string>;
//   signIn?: (input?: any) => Promise<any>;
// }

// export class BackpackWallet {
//   private static instance: BackpackWallet;
//   private connection: Connection;
//   private session: BackpackSession | null = null;
//   private readonly APP_URL = window.location.origin;
//   private readonly BACKPACK_URL = 'https://backpack.app/ul/v1';
//   private readonly dappKeyPair = box.keyPair();

//   private constructor(connection: Connection) {
//     this.connection = connection;
//   }

//   static getInstance(connection: Connection): BackpackWallet {
//     if (!BackpackWallet.instance) {
//       BackpackWallet.instance = new BackpackWallet(connection);
//     }
//     return BackpackWallet.instance;
//   }

//   async connect(): Promise<{ publicKey: PublicKey; session: string }> {
//     try {
//       const params = new URLSearchParams({
//         app_url: encodeURIComponent(this.APP_URL),
//         dapp_encryption_public_key: bs58Encode(this.dappKeyPair.publicKey),
//         redirect_link: encodeURIComponent(`${this.APP_URL}/wallet-callback`),
//         cluster: 'soon-testnet'
//       });

//       // Önce bağlantıyı test et
//       try {
//         await this.connection.getVersion();
//       } catch (error) {
//         console.error('Network connection error:', error);
//         throw new Error('Unable to connect to network. Please try again.');
//       }

//       const connectUrl = `${this.BACKPACK_URL}/connect?${params.toString()}`;
      
//       // Backpack popup'ını aç
//       const connectWindow = window.open(connectUrl, 'Connect to Backpack', 'width=420,height=600');
//       if (!connectWindow) {
//         throw new Error('Popup blocked. Please allow popups and try again.');
//       }
//       connectWindow.focus();

//       const response = await new Promise<BackpackSession>((resolve, reject) => {
//         const cleanup = () => {
//           window.removeEventListener('message', handleMessage);
//           connectWindow.close();
//         };

//         const handleMessage = (event: MessageEvent) => {
//           if (event.origin !== 'https://backpack.app') return;

//           try {
//             const { data } = event;
//             if (data.type === 'BACKPACK_CONNECT_RESPONSE') {
//               cleanup();
//               if (data.error) {
//                 reject(new Error(data.error));
//               } else {
//                 resolve(data.session);
//               }
//             }
//           } catch (error) {
//             cleanup();
//             reject(error);
//           }
//         };

//         window.addEventListener('message', handleMessage);

//         setTimeout(() => {
//           cleanup();
//           reject(new Error('Connection timeout. Please try again.'));
//         }, 300000);
//       });

//       this.session = response;
//       return {
//         publicKey: new PublicKey(response.publicKey),
//         session: response.session
//       };
//     } catch (error) {
//       console.error('Backpack connection error:', error);
//       throw error;
//     }
//   }

//   async disconnect(): Promise<void> {
//     if (!this.session) {
//       throw new Error('Not connected to Backpack');
//     }

//     try {
//       const nonce = bs58Encode(randomBytes(24));
//       const params = new URLSearchParams({
//         dapp_encryption_public_key: bs58Encode(this.dappKeyPair.publicKey),
//         nonce,
//         redirect_link: encodeURIComponent(`${this.APP_URL}/wallet-callback`),
//       });

//       const payload = {
//         session: this.session.session,
//       };

//       const disconnectUrl = `${this.BACKPACK_URL}/disconnect?${params.toString()}&payload=${encodeURIComponent(
//         JSON.stringify(payload)
//       )}`;

//       const disconnectWindow = window.open(disconnectUrl, 'Disconnect Backpack', 'width=420,height=600');
//       if (disconnectWindow) {
//         disconnectWindow.close();
//       }

//       await new Promise<void>((resolve, reject) => {
//         const handleMessage = (event: MessageEvent) => {
//           if (event.origin !== 'https://backpack.app') return;

//           const { data } = event;
//           if (data.type === 'BACKPACK_DISCONNECT_RESPONSE') {
//             window.removeEventListener('message', handleMessage);
//             if (data.error) {
//               reject(new Error(data.error));
//             } else {
//               resolve();
//             }
//           }
//         };

//         window.addEventListener('message', handleMessage);
//       });

//       this.session = null;
//     } catch (error) {
//       console.error('Backpack disconnect error:', error);
//       throw error;
//     }
//   }

//   async signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> {
//     if (!this.session) {
//       throw new Error('Not connected to Backpack');
//     }

//     try {
//       const signedTransaction = await this._signTransaction(transaction);
//       return signedTransaction;
//     } catch (error) {
//       console.error('Transaction signing error:', error);
//       throw error;
//     }
//   }

//   private async _signTransaction(transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> {
//     // Implement the logic to sign the transaction without sending it
//     // Since Backpack provides a signTransaction method, use that endpoint

//     const serializedTx = bs58Encode(transaction.serialize({ requireAllSignatures: false }));
//     const nonce = bs58Encode(randomBytes(24));

//     const params = new URLSearchParams({
//       dapp_encryption_public_key: bs58Encode(this.dappKeyPair.publicKey),
//       nonce,
//       redirect_link: encodeURIComponent(`${this.APP_URL}/wallet-callback`),
//     });

//     const payload = {
//       transaction: serializedTx,
//       session: this.session!.session,
//     };

//     const signUrl = `${this.BACKPACK_URL}/signTransaction?${params.toString()}&payload=${encodeURIComponent(
//       JSON.stringify(payload)
//     )}`;

//     const signWindow = window.open(signUrl, 'Sign Transaction', 'width=420,height=600');
//     if (signWindow) {
//       signWindow.focus();
//     }

//     const response = await new Promise<{ transaction: string }>((resolve, reject) => {
//       const handleMessage = (event: MessageEvent) => {
//         if (event.origin !== 'https://backpack.app') return;

//         const { data } = event;
//         if (data.type === 'BACKPACK_SIGN_TRANSACTION_RESPONSE') {
//           window.removeEventListener('message', handleMessage);
//           if (data.error) {
//             reject(new Error(data.error));
//           } else {
//             resolve(data);
//           }
//         }
//       };

//       window.addEventListener('message', handleMessage);
//     });

//     const signedTxData = bs58Decode(response.transaction);
//     const signedTransaction = Transaction.from(signedTxData);

//     return signedTransaction;
//   }

//   async signAllTransactions(
//     transactions: (Transaction | VersionedTransaction)[]
//   ): Promise<(Transaction | VersionedTransaction)[]> {
//     if (!this.session) {
//       throw new Error('Not connected to Backpack');
//     }

//     try {
//       const signedTransactions = await this._signAllTransactions(transactions);
//       return signedTransactions;
//     } catch (error) {
//       console.error('Sign all transactions error:', error);
//       throw error;
//     }
//   }

//   private async _signAllTransactions(
//     transactions: (Transaction | VersionedTransaction)[]
//   ): Promise<(Transaction | VersionedTransaction)[]> {
//     // Implement the logic to sign all transactions
//     const serializedTxs = transactions.map((tx) => bs58Encode(tx.serialize({ requireAllSignatures: false })));
//     const nonce = bs58Encode(randomBytes(24));

//     const params = new URLSearchParams({
//       dapp_encryption_public_key: bs58Encode(this.dappKeyPair.publicKey),
//       nonce,
//       redirect_link: encodeURIComponent(`${this.APP_URL}/wallet-callback`),
//     });

//     const payload = {
//       transactions: serializedTxs,
//       session: this.session!.session,
//     };

//     const signUrl = `${this.BACKPACK_URL}/signAllTransactions?${params.toString()}&payload=${encodeURIComponent(
//       JSON.stringify(payload)
//     )}`;

//     const signWindow = window.open(signUrl, 'Sign All Transactions', 'width=420,height=600');
//     if (signWindow) {
//       signWindow.focus();
//     }

//     const response = await new Promise<{ transactions: string[] }>((resolve, reject) => {
//       const handleMessage = (event: MessageEvent) => {
//         if (event.origin !== 'https://backpack.app') return;

//         const { data } = event;
//         if (data.type === 'BACKPACK_SIGN_ALL_TRANSACTIONS_RESPONSE') {
//           window.removeEventListener('message', handleMessage);
//           if (data.error) {
//             reject(new Error(data.error));
//           } else {
//             resolve(data);
//           }
//         }
//       };

//       window.addEventListener('message', handleMessage);
//     });

//     const signedTransactions = response.transactions.map((txData) => Transaction.from(bs58Decode(txData)));
//     return signedTransactions;
//   }

//   async signAndSendTransaction(transaction: Transaction): Promise<string> {
//     if (!this.session) {
//       throw new Error('Not connected to Backpack');
//     }

//     try {
//       const serializedTx = bs58Encode(transaction.serialize({ requireAllSignatures: false }));
//       const nonce = bs58Encode(randomBytes(24));

//       const params = new URLSearchParams({
//         dapp_encryption_public_key: bs58Encode(this.dappKeyPair.publicKey),
//         nonce,
//         redirect_link: encodeURIComponent(`${this.APP_URL}/wallet-callback`),
//       });

//       const payload = {
//         transaction: serializedTx,
//         session: this.session.session,
//       };

//       const signUrl = `${this.BACKPACK_URL}/signAndSendTransaction?${params.toString()}&payload=${encodeURIComponent(
//         JSON.stringify(payload)
//       )}`;

//       const signWindow = window.open(signUrl, 'Sign and Send Transaction', 'width=420,height=600');
//       if (signWindow) {
//         signWindow.focus();
//       }

//       const response = await new Promise<{ signature: string }>((resolve, reject) => {
//         const handleMessage = (event: MessageEvent) => {
//           if (event.origin !== 'https://backpack.app') return;

//           const { data } = event;
//           if (data.type === 'BACKPACK_SIGN_AND_SEND_TRANSACTION_RESPONSE') {
//             window.removeEventListener('message', handleMessage);
//             if (data.error) {
//               reject(new Error(data.error));
//             } else {
//               resolve(data);
//             }
//           }
//         };

//         window.addEventListener('message', handleMessage);
//       });

//       return response.signature;
//     } catch (error) {
//       console.error('Transaction signing and sending error:', error);
//       throw error;
//     }
//   }

//   async signMessage(message: Uint8Array): Promise<Uint8Array> {
//     if (!this.session) {
//       throw new Error('Not connected to Backpack');
//     }

//     try {
//       const encodedMessage = bs58Encode(message);
//       const nonce = bs58Encode(randomBytes(24));

//       const params = new URLSearchParams({
//         dapp_encryption_public_key: bs58Encode(this.dappKeyPair.publicKey),
//         nonce,
//         redirect_link: encodeURIComponent(`${this.APP_URL}/wallet-callback`),
//       });

//       const payload = {
//         message: encodedMessage,
//         session: this.session.session,
//         display: 'utf8',
//       };

//       const signUrl = `${this.BACKPACK_URL}/signMessage?${params.toString()}&payload=${encodeURIComponent(
//         JSON.stringify(payload)
//       )}`;

//       const signWindow = window.open(signUrl, 'Sign Message', 'width=420,height=600');
//       if (signWindow) {
//         signWindow.focus();
//       }

//       const response = await new Promise<{ signature: string }>((resolve, reject) => {
//         const handleMessage = (event: MessageEvent) => {
//           if (event.origin !== 'https://backpack.app') return;

//           const { data } = event;
//           if (data.type === 'BACKPACK_SIGN_MESSAGE_RESPONSE') {
//             window.removeEventListener('message', handleMessage);
//             if (data.error) {
//               reject(new Error(data.error));
//             } else {
//               resolve(data);
//             }
//           }
//         };

//         window.addEventListener('message', handleMessage);
//       });

//       return bs58Decode(response.signature);
//     } catch (error) {
//       console.error('Message signing error:', error);
//       throw error;
//     }
//   }

//   async sendTransaction(
//     transaction: Transaction | VersionedTransaction,
//     connection: Connection,
//     options?: SendOptions
//   ): Promise<string> {
//     if (!this.session) {
//       throw new Error('Not connected to Backpack');
//     }

//     // Implement sending logic using the connection and options provided
//     // Since Backpack handles the sending via signAndSendTransaction, we'll use that

//     try {
//       const signature = await this.signAndSendTransaction(transaction as Transaction);
//       return signature;
//     } catch (error) {
//       console.error('Send transaction error:', error);
//       throw error;
//     }
//   }

//   async signIn(): Promise<any> {
//     // Implement sign in logic if needed
//     throw new Error('Sign in not supported');
//   }

//   isConnected(): boolean {
//     return this.session !== null;
//   }

//   getPublicKey(): PublicKey | null {
//     return this.session ? new PublicKey(this.session.publicKey) : null;
//   }

//   getProvider(): BackpackProvider {
//     return {
//       signTransaction: this.signTransaction.bind(this),
//       signAllTransactions: this.signAllTransactions.bind(this),
//       signMessage: this.signMessage.bind(this),
//       sendTransaction: this.sendTransaction.bind(this),
//       signIn: this.signIn.bind(this),
//     };
//   }
// }
