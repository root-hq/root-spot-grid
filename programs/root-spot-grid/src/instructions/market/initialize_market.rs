use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::Market;
use crate::constants::MARKET_SEED;

pub fn initialize_market(
    ctx: Context<InitializeMarket>,
    min_order_spacing_bps: u16,
    protocol_fee_per_fill_bps: u16
) -> Result<()> {

    **ctx.accounts.market = Market {
        bump: *ctx.bumps.get("market").unwrap(),
        phoenix_market: ctx.accounts.phoenix_market.key(),
        owner: ctx.accounts.owner.key(),
        protocol_fee_recipient: ctx.accounts.protocol_fee_recipient.key(),
        base_token_mint: ctx.accounts.base_token_mint.key(),
        quote_token_mint: ctx.accounts.quote_token_mint.key(),
        min_order_spacing_bps,
        protocol_fee_per_fill_bps,
        claimed_protocol_fee_in_quote_tokens: 0,
        unclaimed_protocol_fee_in_quote_tokens: 0
    };

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: No constraint needed
    pub phoenix_market: UncheckedAccount<'info>,

    /// CHECK: No constraint needed
    pub protocol_fee_recipient: UncheckedAccount<'info>,

    #[account(
        init,
        seeds = [
            MARKET_SEED.as_bytes(),
            phoenix_market.key().as_ref()
        ],
        bump,
        space = Market::LEN,
        payer = owner
    )]
    pub market: Box<Account<'info, Market>>,

    pub base_token_mint: Account<'info, Mint>,

    pub quote_token_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}