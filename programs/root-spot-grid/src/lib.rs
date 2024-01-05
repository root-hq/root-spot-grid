use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod constants;

declare_id!("13uxuLoQHvpp1K1571WcgoTYEV4Ys5ni7LqjBZiTmNNx");

use instructions::*;

#[program]
pub mod root_spot_grid {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        min_order_spacing_bps: u16,
        protocol_fee_per_fill_bps: u16,
        min_order_size_in_base_lots: u64
    ) -> Result<()> {
        instructions::initialize_market(ctx, min_order_spacing_bps, protocol_fee_per_fill_bps, min_order_size_in_base_lots)
    }

    pub fn update_market(
        ctx: Context<UpdateMarket>,
        new_min_order_spacing_bps: Option<u16>,
        new_protocol_fee_per_fill_bps: Option<u16>,
        new_min_order_size_in_base_lots: Option<u64>,
    ) -> Result<()> {
        instructions::update_market(ctx, new_min_order_spacing_bps, new_protocol_fee_per_fill_bps, new_min_order_size_in_base_lots)
    }

}