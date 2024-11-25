use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone)]
pub enum FileTransferError {
    #[error("Invalid Proof")]
    InvalidProof,
    #[error("Invalid Recipient")]
    InvalidRecipient,
    #[error("Invalid File Hash")]
    InvalidFileHash,
    #[error("Invalid Commitment")]
    InvalidCommitment,
}

impl From<FileTransferError> for ProgramError {
    fn from(e: FileTransferError) -> Self {
        ProgramError::Custom(e as u32)
    }
}