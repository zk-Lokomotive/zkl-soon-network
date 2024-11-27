# zkλ-SOON-Network

**zkλ** is enabling secure, efficient, and decentralized file transfer operations across Solana and Ethereum (SVM) networks. By leveraging zero-knowledge cryptography, this system ensures high performance and confidentiality for cross-chain file sharing and wallet operations.

---
Soon Testnet Program ID: `TdvVTrdwVwYZRGL4mJLjjPBc9SwKraKGoaNJowsrSNX`

### Project Setup
```bash
# Clone the repository
git clone https://github.com/your-username/zkl-soon-network.git

# Install dependencies
cd zkl-soon-network
npm install

# Start development server
npm run dev
```

### Environment Configuration
Create a `.env` file in the project root:

```env
VITE_IPFS_API_URL=http://localhost:5001
VITE_IPFS_GATEWAY_URL=http://localhost:8080
VITE_SOON_RPC_URL=https://rpc.testnet.soo.network/rpc
```



## Features

- **Zero-Knowledge Cryptography**: Ensures privacy and security for file transfers and wallet operations.
- **Cross-Chain Capability**: Operates seamlessly across Solana and Ethereum with Soon.
- **IPFS Integration**: Decentralized file storage with cryptographic tagging.
- **Efficient Processing**: Optimized for scalability on the SOON testnet.

---

## How It Works

### Overview

1. **File Encryption and Tagging**:
   - Files are encrypted using the recipient's public key derived from the **Cross-Chain Identity Registry (CCIR)**.
   - Metadata and cryptographic tags are generated and stored on IPFS.

2. **File Retrieval**:
   - Recipients fetch the file tags from IPFS using their wallets.
   - The files are decrypted locally using the recipient's private key, ensuring end-to-end confidentiality.

3. **Key Infrastructure Components**:
   - **Cross-Chain Identity Registry (CCIR)**: Links public keys to wallet addresses securely.
   - **Key Derivation Service (KDS)**: Generates deterministic keypairs using BIP-39 mnemonics.
   - **IPFS**: Stores encrypted files and associated metadata.

---

## Architecture

The architecture consists of three layers:

1. **User Layer**:
   - Wallets (`Backpack Wallet` (*recommended*)) are the primary interface for users.
   - Handles file operations (send/receive) and wallet-based authentication.

2. **Platform Layer**:
   - **CCIR**:
     - Decentralized directory mapping wallet addresses to public keys.
     - Used for public key retrieval during encryption.
   - **Inbox**:
     - On-chain service that handles incoming and outgoing file messages.
   - **IPFS Integration**:
     - Decentralized file storage ensures security and accessibility.

3. **Infrastructure Layer**:
   - Solana and Ethereum networks form the backbone of blockchain operations.

---

## Cryptographic Mechanisms

### Sending a File
1. Retrieve recipient's public key from CCIR.
2. Generate an ephemeral key pair for secure session establishment.
3. Derive a shared secret using Elliptic Curve Diffie-Hellman (ECDH).
4. Encrypt the file using AES-GCM-256 with the shared secret.
5. Upload the encrypted file and metadata to IPFS.
6. Notify the recipient via on-chain message in the inbox.

### Receiving a File
1. Query the inbox for new messages.
2. Fetch the file tag from IPFS.
3. Decrypt the file using the recipient's private key and reconstruct the original file.

### File Format
The encrypted file format is as follows:
| Bytes               | `[0..4]`       | `[4..1024]`         | `[1024..1024+len(Fc)]` |
| ------------------- | --------------- | ------------------- | ----------------------- |
| **Content**         | Length of metadata | Metadata (Fm)      | Encrypted file content (Fc) |
| **Length in bytes** | 4 bytes         | 1020 bytes          | Variable                |

---

## Deployment

### Prerequisites
1. **SOON Testnet RPC**:
   - RPC URL: `https://rpc.testnet.soo.network/rpc`
   - WebSocket URL: `wss://rpc.testnet.soo.network/rpc`
2. **Keypair Configuration**:
   ```yaml
   Keypair Path: /path/to/soon.json
   ```

### Deploy Program on Soon Testnet
```bash
solana program deploy ./target/deploy/zk_lokomotive.so
```
Program ID: `TdvVTrdwVwYZRGL4mJLjjPBc9SwKraKGoaNJowsrSNX`

---

## File Tagging and Retrieval via IPFS

1. **Tagging**:
   - Each file is associated with metadata and a unique hash before encryption.
   - The hash acts as a reference for IPFS retrieval.
2. **Retrieval**:
   - Users access tagged files by resolving the hash via their wallets.
   - The files are decrypted using private keys, ensuring confidentiality.

### IPFS Utilities
- **FileUpload.tsx**:
  - Uploads files to IPFS and generates unique hashes.
- **ipfs.ts**:
  - Manages IPFS connections and operations for file storage and retrieval.
 
### Troubleshooting IPFS

1. **CORS Issues**
```bash
# Reset CORS configuration
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '[
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
```

2. **Connection Issues**
```bash
# Check if IPFS daemon is running
ps aux | grep ipfs

# Check API availability
curl -X POST http://localhost:5001/api/v0/id

# Reset IPFS repository
ipfs repo gc
```

3. **Performance Optimization**
```bash
# Configure connection manager
ipfs config --json Swarm.ConnMgr.HighWater 200
ipfs config --json Swarm.ConnMgr.LowWater 150

# Enable file store garbage collection
ipfs config --json Datastore.GCPeriod "1h"
```

Add the following content:
```ini
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
User=your-username
Environment=IPFS_PATH=/home/your-username/.ipfs
ExecStart=/usr/local/bin/ipfs daemon
Restart=always

[Install]
WantedBy=multi-user.target
```

Manage the service:
```bash
# Enable service
sudo systemctl enable ipfs

# Start service
sudo systemctl start ipfs

# Check status
sudo systemctl status ipfs

# View logs
journalctl -u ipfs -f
```


---

## Submodules

### Client Submodules
1. **aus**: Handles interactions with distributed file systems like IPFS.
2. **roadhog**: Interfaces with blockchain programs (Solana/Ethereum).
3. **crypto**: Manages cryptographic operations (ECIES, AES-GCM-256).
4. **kds**: Generates BIP-39 mnemonics for keypair creation.

### Platform Submodules
1. **CCIR**: Manages the mapping of wallet addresses to public keys.
2. **Inbox**: Decentralized messaging queue for file notifications.

---

## Contributing

- Follow the module-based development approach outlined in [COLLABORATING.md](./COLLABORATING.md).
- Use **pure functions** and document APIs with JSDoc.
- Handle errors gracefully, using `console.warn` for non-breaking issues.

---

## Credits

2024 © zk-Lokomotive Team  
[https://zk-lokomotive.xyz](https://zk-lokomotive.xyz)






