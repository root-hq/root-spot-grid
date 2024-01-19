use crate::{constants::*, Market};
use crate::errors::SpotGridError;
use crate::state::Position;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
    let trade_manager_bump = *ctx.bumps.get("trade_manager").unwrap();

    let position_address = ctx.accounts.position.key();

    let trade_manager_seeds = &[
        TRADE_MANAGER_SEED.as_bytes(),
        position_address.as_ref(),
        &[trade_manager_bump],
    ];
    let trade_manager_signer_seeds = &[&trade_manager_seeds[..]];

    let trade_manager_balance = ctx.accounts.trade_manager.lamports();

    let mut not_null_counts = 0;
    for entry in &ctx.accounts.position.active_orders {
        if !entry.is_null {
            not_null_counts += 1;
        }
    }

    require!(not_null_counts == 0, SpotGridError::PendingOpenOrders);

    // Transfer back the amounts to the user
    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.base_token_vault_ac.to_account_info(),
                to: ctx.accounts.base_token_user_ac.to_account_info(),
                authority: ctx.accounts.trade_manager.to_account_info(),
            },
            trade_manager_signer_seeds,
        ),
        ctx.accounts.base_token_vault_ac.amount,
    )?;

    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.quote_token_vault_ac.to_account_info(),
                to: ctx.accounts.quote_token_user_ac.to_account_info(),
                authority: ctx.accounts.trade_manager.to_account_info(),
            },
            trade_manager_signer_seeds,
        ),
        ctx.accounts.quote_token_vault_ac.amount,
    )?;

    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.trade_manager.key(),
        &ctx.accounts.creator.key(),
        trade_manager_balance,
    );
    invoke_signed(
        &transfer_ix,
        &[
            ctx.accounts.creator.to_account_info(),
            ctx.accounts.trade_manager.to_account_info(),
        ],
        trade_manager_signer_seeds,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    /// CHECK: No constraint needed
    pub phoenix_market: UncheckedAccount<'info>,

    /// CHECK: No constraint needed
    pub position_key: UncheckedAccount<'info>,

    /// CHECK: No constraint needed
    pub protocol_fee_recipient: UncheckedAccount<'info>,

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

    pub base_token_mint: Box<Account<'info, Mint>>,

    pub quote_token_mint: Box<Account<'info, Mint>>,

    #[account(
        has_one = phoenix_market,
        has_one = base_token_mint,
        has_one = quote_token_mint,
        has_one = protocol_fee_recipient
    )]
    pub spot_grid_market: Box<Account<'info, Market>>,

    #[account(
        mut,
        seeds = [
            POSITION_SEED.as_bytes(),
            position_key.key().as_ref()
        ],
        bump = position.bump,
        has_one = spot_grid_market,
        close = creator
    )]
    pub position: Box<Account<'info, Position>>,

    #[account(
        mut,
        token::mint = base_token_mint,
        token::authority = creator,
    )]
    pub base_token_user_ac: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = quote_token_mint,
        token::authority = creator,
    )]
    pub quote_token_user_ac: Box<Account<'info, TokenAccount>>,

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

    #[account(
        mut,
        token::mint = base_token_mint,
        token::authority = protocol_fee_recipient
    )]
    pub base_token_fee_ac: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = quote_token_mint,
        token::authority = protocol_fee_recipient
    )]
    pub quote_token_fee_ac: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}
