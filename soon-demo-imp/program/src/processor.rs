use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
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
                file_hash,
                commitment,
            } => {
                msg!("Instruction: InitTransfer");
                Self::process_init_transfer(
                    program_id,
                    accounts,
                    proof,
                    file_hash,
                    commitment,
                )
            }
            FileTransferInstruction::ConfirmReceipt { nullifier } => {
                msg!("Instruction: ConfirmReceipt");
                Self::process_confirm_receipt(program_id, accounts, nullifier)
            }
        }
    }

    fn process_init_transfer(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        proof: Vec<u8>,
        file_hash: [u8; 32],
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
        if !Self::verify_proof(&proof, &file_hash, &commitment)? {
            return Err(FileTransferError::InvalidProof.into());
        }

        // Initialize transfer state
        let transfer_state = TransferState::Pending {
            sender: *sender_info.key,
            recipient: *recipient_info.key,
            file_hash,
            commitment,
            proof,
        };

        transfer_state.serialize(&mut *state_info.data.borrow_mut())?;

        msg!("Transfer initialized successfully");
        Ok(())
    }

    fn verify_proof(
        proof: &[u8],
        file_hash: &[u8; 32],
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

        // Verify file_hash matches commitment
        let computed_commitment = Self::compute_commitment(file_hash)?;
        Ok(&computed_commitment == commitment)
    }

    fn compute_commitment(file_hash: &[u8; 32]) -> Result<[u8; 32], ProgramError> {
        use solana_program::keccak::hash;
        
        // Using Keccak256 since it's already available in solana_program
        let result = hash(file_hash);
        Ok(result.to_bytes())
    }

    fn process_confirm_receipt(
        _program_id: &Pubkey,
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
}