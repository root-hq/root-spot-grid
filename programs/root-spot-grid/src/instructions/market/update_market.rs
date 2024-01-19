use anchor_lang::prelude::*;

use crate::state::Market;

pub fn update_market(
    ctx: Context<UpdateMarket>,
    new_withdrawal_fee_in_bps_hundredths: Option<u64>,
    new_min_order_spacing_in_ticks: Option<u64>,
    new_min_order_size_in_base_lots: Option<u64>,
) -> Result<()> {
    ctx.accounts.market.min_order_spacing_in_ticks =
        new_min_order_spacing_in_ticks.unwrap_or(ctx.accounts.market.min_order_spacing_in_ticks);
    ctx.accounts.market.min_order_size_in_base_lots =
        new_min_order_size_in_base_lots.unwrap_or(ctx.accounts.market.min_order_size_in_base_lots);
    ctx.accounts.market.withdrawal_fee_in_bps_hundredths =
    new_withdrawal_fee_in_bps_hundredths.unwrap_or(ctx.accounts.market.withdrawal_fee_in_bps_hundredths);

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
