use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

declare_id!("13uxuLoQHvpp1K1571WcgoTYEV4Ys5ni7LqjBZiTmNNx");

use instructions::*;
use state::*;

#[program]
pub mod root_spot_grid {
    use crate::state::PositionArgs;

    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        withdrawal_fee_in_bps_hundredths: u64,
        min_order_spacing_in_ticks: u64,
        min_order_size_in_base_lots: u64,
    ) -> Result<()> {
        instructions::initialize_market(
            ctx,
            withdrawal_fee_in_bps_hundredths,
            min_order_spacing_in_ticks,
            min_order_size_in_base_lots,
        )
    }

    pub fn update_market(
        ctx: Context<UpdateMarket>,
        new_protocol_fee_per_fill_bps: Option<u64>,
        min_order_spacing_in_ticks: Option<u64>,
        new_min_order_size_in_base_lots: Option<u64>,
    ) -> Result<()> {
        instructions::update_market(
            ctx,
            new_protocol_fee_per_fill_bps,
            min_order_spacing_in_ticks,
            new_min_order_size_in_base_lots,
        )
    }

    pub fn create_position(ctx: Context<CreatePosition>, args: PositionArgs) -> Result<()> {
        instructions::create_position(ctx, args)
    }

    pub fn cancel_orders(ctx: Context<CancelOrders>) -> Result<()> {
        instructions::cancel_orders(ctx)
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        instructions::close_position(ctx)
    }

    pub fn refresh_orders(ctx: Context<RefreshOrders>) -> Result<()> {
        instructions::refresh_orders(ctx)
    }
}
