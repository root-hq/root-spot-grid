use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::SpotGridMarket;
use crate::constants::MARKET_SEED;

pub fn initialize_spot_grid_market(
    ctx: Context<InitializeSpotGridMarket>,
    min_price_difference_bps: u16,
    min_price_difference_pct_hundredths: u16
) -> Result<()> {

    **ctx.accounts.market = SpotGridMarket {
        bump: *ctx.bumps.get("market").unwrap(),
        phoenix_market: ctx.accounts.phoenix_market.key(),
        owner: ctx.accounts.owner.key(),
        protocol_fee_recipient: ctx.accounts.protocol_fee_recipient.key(),
        base_token_mint: ctx.accounts.base_token_mint.key(),
        quote_token_mint: ctx.accounts.quote_token_mint.key(),
        min_price_difference_bps,
        min_price_difference_pct_hundredths
    };

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeSpotGridMarket<'info> {
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
        space = SpotGridMarket::LEN,
        payer = owner
    )]
    pub market: Box<Account<'info, SpotGridMarket>>,

    pub base_token_mint: Account<'info, Mint>,

    pub quote_token_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}