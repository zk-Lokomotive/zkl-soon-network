use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum TransferState {
    Uninitialized,
    Pending {
        sender: Pubkey,
        recipient: Pubkey,
        file_hash: [u8; 32],
        commitment: [u8; 32],
        proof: Vec<u8>,
    },
    Completed {
        nullifier: [u8; 32],
    },
}

impl TransferState {
    pub const SIZE: usize = 1 + 32 + 32 + 32 + 32 + 512; // Max size estimation
}