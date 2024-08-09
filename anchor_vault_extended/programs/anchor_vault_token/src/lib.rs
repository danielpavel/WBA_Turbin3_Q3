use anchor_lang::prelude::*;

declare_id!("CSV4JPXkoewv1ZWCvy6GmaDQpgXotKW7gy5BPbVH9XAN");

pub mod context;
use context::*;

pub mod state;
use state::*;

#[program]
pub mod anchor_vault_token {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, amount: u64, receive: u64) -> Result<()> {
        msg!("make");

        ctx.accounts.save_escrow(seed, receive, &ctx.bumps)?;
        ctx.accounts.deposit_to_vault(amount)
    }
    pub fn take(ctx: Context<Take>) -> Result<()> {
        msg!("take");
        ctx.accounts.transfer_to_maker()?;
        ctx.accounts.withdraw_and_close()
    }
    pub fn deposit(ctx: Context<Refund>) -> Result<()> {
        msg!("refund");
        ctx.accounts.withdraw_and_close()
    }
}
