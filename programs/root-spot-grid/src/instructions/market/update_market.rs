use anchor_lang::prelude::*;

use crate::state::Market;

pub fn update_market(
    ctx: Context<UpdateMarket>,
    new_protocol_fee_per_fill_bps: Option<u16>,
    new_min_order_spacing_in_ticks: Option<u64>,
    new_min_order_size_in_base_lots: Option<u64>,
) -> Result<()> {
    ctx.accounts.market.min_order_spacing_in_ticks =
        new_min_order_spacing_in_ticks.unwrap_or(ctx.accounts.market.min_order_spacing_in_ticks);
    ctx.accounts.market.min_order_size_in_base_lots =
        new_min_order_size_in_base_lots.unwrap_or(ctx.accounts.market.min_order_size_in_base_lots);
    ctx.accounts.market.protocol_fee_per_fill_bps =
        new_protocol_fee_per_fill_bps.unwrap_or(ctx.accounts.market.protocol_fee_per_fill_bps);

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateMarket<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner
    )]
    pub market: Box<Account<'info, Market>>,
}
