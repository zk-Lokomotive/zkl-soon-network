use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum TransferState {
    Pending {
        sender: Pubkey,
        recipient: Pubkey, 
        ipfs_cid: String,  
        commitment: [u8; 32], 
        proof: Vec<u8>, 
        public_signals: Vec<String>, 
        file_hash: String, 
    },
    Completed {
        nullifier: [u8; 32],
    },
}

pub enum FileTransferInstruction {
    InitTransfer {
        proof: Vec<u8>,
        public_signals: Vec<String>,
        ipfs_cid: String,
        commitment: [u8; 32],
        file_hash: String, 
    },
    ConfirmReceipt { nullifier: [u8; 32] },
}



impl TransferState {
    pub const SIZE: usize = 1 + 32 + 32 + 32 + 32 + 512; // Max size estimation
}