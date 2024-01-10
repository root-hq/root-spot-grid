use crate::constants::*;
use crate::state::{OrderParams, Position};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub fn cancel_orders(ctx: Context<CancelOrders>) -> Result<()> {
    let trade_manager_bump = *ctx.bumps.get("trade_manager").unwrap();

    let position_address = ctx.accounts.position.key();

    let trade_manager_seeds = &[
        TRADE_MANAGER_SEED.as_bytes(),
        position_address.as_ref(),
        &[trade_manager_bump],
    ];
    let trade_manager_signer_seeds = &[&trade_manager_seeds[..]];

    // Cancel all old orders
    invoke_signed(
        &phoenix::program::create_cancel_all_orders_instruction_with_custom_token_accounts(
            &ctx.accounts.phoenix_market.key(),
            &ctx.accounts.trade_manager.key(),
            &ctx.accounts.base_token_vault_ac.key(),
            &ctx.accounts.quote_token_vault_ac.key(),
            &ctx.accounts.base_token_mint.key(),
            &ctx.accounts.quote_token_mint.key(),
        ),
        &[
            ctx.accounts.phoenix_program.to_account_info(),
            ctx.accounts.log_authority.to_account_info(),
            ctx.accounts.phoenix_market.to_account_info(),
            ctx.accounts.trade_manager.to_account_info(),
            ctx.accounts.base_token_vault_ac.to_account_info(),
            ctx.accounts.quote_token_vault_ac.to_account_info(),
            ctx.accounts.base_phoenix_vault.to_account_info(),
            ctx.accounts.quote_phoenix_vault.to_account_info(),
        ],
        trade_manager_signer_seeds,
    )?;

    ctx.accounts.position.active_orders = [OrderParams::default(); 15];

    // Withdraw all funds
    invoke_signed(
        &phoenix::program::create_withdraw_funds_instruction_with_custom_token_accounts(
            &ctx.accounts.phoenix_market.key(),
            &ctx.accounts.trade_manager.key(),
            &ctx.accounts.base_token_vault_ac.key(),
            &ctx.accounts.quote_token_vault_ac.key(),
            &ctx.accounts.base_token_mint.key(),
            &ctx.accounts.quote_token_mint.key(),
        ),
        &[
            ctx.accounts.phoenix_program.to_account_info(),
            ctx.accounts.log_authority.to_account_info(),
            ctx.accounts.phoenix_market.to_account_info(),
            ctx.accounts.trade_manager.to_account_info(),
            ctx.accounts.base_token_vault_ac.to_account_info(),
            ctx.accounts.quote_token_vault_ac.to_account_info(),
            ctx.accounts.base_phoenix_vault.to_account_info(),
            ctx.accounts.quote_phoenix_vault.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        trade_manager_signer_seeds,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CancelOrders<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    /// CHECK: No constraint needed
    pub phoenix_market: UncheckedAccount<'info>,

    /// CHECK: No constraint needed
    pub position_key: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            TRADE_MANAGER_SEED.as_bytes(),
            position.key().as_ref(),
        ],
        bump,
    )]
    /// CHECK: No constraint needed
    pub trade_manager: UncheckedAccount<'info>,

    /// CHECK: Checked in CPI
    pub log_authority: UncheckedAccount<'info>,

    pub base_token_mint: Box<Account<'info, Mint>>,

    pub quote_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            POSITION_SEED.as_bytes(),
            position_key.key().as_ref()
        ],
        bump = position.bump,
    )]
    pub position: Box<Account<'info, Position>>,

    #[account(
        mut,
        token::mint = base_token_mint,
        token::authority = trade_manager
    )]
    pub base_token_vault_ac: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = quote_token_mint,
        token::authority = trade_manager
    )]
    pub quote_token_vault_ac: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Checked in CPI
    pub base_phoenix_vault: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in CPI
    pub quote_phoenix_vault: UncheckedAccount<'info>,

    /// CHECK: Checked in CPI
    pub phoenix_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}
