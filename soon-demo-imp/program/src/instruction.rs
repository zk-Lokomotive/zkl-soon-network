use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum FileTransferInstruction {
    /// Initializes a new file transfer with ZK proof
    /// Accounts expected:
    /// 0. `[signer]` The sender's account
    /// 1. `[writable]` The recipient's account
    /// 2. `[writable]` The transfer state account
    InitTransfer {
        /// ZK proof of file ownership and transfer rights
        proof: Vec<u8>,
        /// Hash of the file being transferred
        file_hash: [u8; 32],
        /// Commitment to the transfer parameters
        commitment: [u8; 32],
    },
    
    /// Confirms receipt of the file
    /// Accounts expected:
    /// 0. `[signer]` The recipient's account
    /// 1. `[writable]` The transfer state account
    ConfirmReceipt {
        /// Nullifier to prevent double-claiming
        nullifier: [u8; 32],
    },
}