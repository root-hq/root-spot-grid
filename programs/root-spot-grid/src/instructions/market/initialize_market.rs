use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::constants::MARKET_SEED;
use crate::state::Market;

pub fn initialize_market(
    ctx: Context<InitializeMarket>,
    withdrawal_fee_in_bps_hundredths: u64,
    min_order_spacing_in_ticks: u64,
    min_order_size_in_base_lots: u64,
) -> Result<()> {
    **ctx.accounts.market = Market {
        bump: *ctx.bumps.get("market").unwrap(),
        phoenix_market: ctx.accounts.phoenix_market.key(),
        spot_grid_market_key: ctx.accounts.spot_grid_market_key.key(),
        owner: ctx.accounts.owner.key(),
        protocol_fee_recipient: ctx.accounts.protocol_fee_recipient.key(),
        base_token_mint: ctx.accounts.base_token_mint.key(),
        quote_token_mint: ctx.accounts.quote_token_mint.key(),
        min_order_spacing_in_ticks,
        min_order_size_in_base_lots,
        withdrawal_fee_in_bps_hundredths,
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

    /// CHECK: No constraint needed
    pub spot_grid_market_key: UncheckedAccount<'info>,

    #[account(
        init,
        seeds = [
            MARKET_SEED.as_bytes(),
            phoenix_market.key().as_ref(),
            spot_grid_market_key.key().as_ref()
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
