use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
use borsh::{BorshDeserialize, BorshSerialize};
use serde_json::Value;

use crate::{
    error::FileTransferError,
    instruction::FileTransferInstruction,
    state::TransferState,
};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = FileTransferInstruction::try_from_slice(instruction_data)?;

        match instruction {
            FileTransferInstruction::InitTransfer {
                proof,
                public_signals,
                ipfs_cid,
                commitment,
                file_hash, 
            } => {
                msg!("Instruction: InitTransfer");
                Self::process_init_transfer(
                    program_id,
                    accounts,
                    proof,
                    public_signals,
                    ipfs_cid,
                    commitment,
                    file_hash, 
                )
            }
            FileTransferInstruction::ConfirmReceipt { nullifier } => {
                msg!("Instruction: ConfirmReceipt");
                Self::process_confirm_receipt(program_id, accounts, nullifier)
            }
        }
        }
    }

    fn process_init_transfer(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        proof: Vec<u8>,
        public_signals: Vec<String>,
        ipfs_cid: String,
        commitment: [u8; 32],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let sender_info = next_account_info(account_info_iter)?;
        let recipient_info = next_account_info(account_info_iter)?;
        let state_info = next_account_info(account_info_iter)?;

        // Verify sender is signer
        if !sender_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Verify ZK proof
        if !Self::verify_proof(&proof, &public_signals, &commitment)? {
            return Err(FileTransferError::InvalidProof.into());
        }

        // Initialize transfer state
        let transfer_state = TransferState::Pending {
            sender: *sender_info.key,
            recipient: *recipient_info.key,
            ipfs_cid,
            commitment,
            proof,
            public_signals,
            file_hash,
        };

        transfer_state.serialize(&mut *state_info.data.borrow_mut())?;

        msg!("Transfer initialized successfully");
        Ok(())
    }

    fn verify_proof(
        proof: &[u8],
        public_signals: &[String],
        commitment: &[u8; 32],
    ) -> Result<bool, ProgramError> {
        // Parse proof data
        let proof_data: Value = serde_json::from_slice(proof)
            .map_err(|_| FileTransferError::InvalidProof)?;

        // In production, this would use a proper ZK verification library
        // For now, we'll do a simplified verification
        let proof_valid = proof_data.get("pi_a").is_some() &&
            proof_data.get("pi_b").is_some() &&
            proof_data.get("pi_c").is_some();

        if !proof_valid {
            return Ok(false);
        }

        // Verify public signals match commitment
        let computed_commitment = Self::compute_commitment(public_signals)?;
        Ok(computed_commitment == commitment)
    }

    fn compute_commitment(public_signals: &[String]) -> Result<[u8; 32], ProgramError> {
        // In production, this would use the same Poseidon hash as the circuit
        // For now, we'll use a simple SHA-256
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        
        for signal in public_signals {
            hasher.update(signal.as_bytes());
        }
        
        let result = hasher.finalize();
        let mut commitment = [0u8; 32];
        commitment.copy_from_slice(&result[..]);
        
        Ok(commitment)
    }

    fn process_confirm_receipt(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        nullifier: [u8; 32],
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let recipient_info = next_account_info(account_info_iter)?;
        let state_info = next_account_info(account_info_iter)?;

        // Verify recipient is signer
        if !recipient_info.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Load and verify transfer state
        let state = TransferState::try_from_slice(&state_info.data.borrow())?;
        match state {
            TransferState::Pending {
                recipient,
                ..
            } => {
                if recipient != *recipient_info.key {
                    return Err(FileTransferError::InvalidRecipient.into());
                }
            }
            _ => return Err(ProgramError::InvalidAccountData),
        }

        // Update state to completed
        let completed_state = TransferState::Completed { nullifier };
        completed_state.serialize(&mut *state_info.data.borrow_mut())?;

        msg!("Transfer completed successfully");
        Ok(())
    }
