use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub vault_state_bump: u8,
    pub vault_bump: u8,
}
