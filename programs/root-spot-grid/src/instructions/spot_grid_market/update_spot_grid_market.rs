use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::SpotGridMarket;
use crate::constants::MARKET_SEED;

pub fn update_spot_grid_market(
    ctx: Context<UpdateSpotGridMarket>,
    new_min_order_spacing_bps: Option<u16>,
    new_protocol_fee_per_fill_bps: Option<u16>
) -> Result<()> {

    ctx.accounts.market.min_order_spacing_bps = new_min_order_spacing_bps.unwrap_or(ctx.accounts.market.min_order_spacing_bps);
    ctx.accounts.market.protocol_fee_per_fill_bps = new_protocol_fee_per_fill_bps.unwrap_or(ctx.accounts.market.protocol_fee_per_fill_bps);

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateSpotGridMarket<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: No constraint needed
    pub phoenix_market: UncheckedAccount<'info>,

    /// CHECK: No constraint needed
    pub protocol_fee_recipient: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            MARKET_SEED.as_bytes(),
            phoenix_market.key().as_ref()
        ],
        bump = market.bump,
        has_one = owner
    )]
    pub market: Box<Account<'info, SpotGridMarket>>,

    pub base_token_mint: Account<'info, Mint>,

    pub quote_token_mint: Account<'info, Mint>,
}