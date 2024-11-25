use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum FileTransferInstruction {
    InitTransfer {
        proof: Vec<u8>,
        public_signals: Vec<String>,
        ipfs_cid: String,
        commitment: [u8; 32],
        file_hash: String, // {{ edit_1: file_hash alanı eklendi }}
    },
    ConfirmReceipt { nullifier: [u8; 32] },
}
