use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod constants;

declare_id!("13uxuLoQHvpp1K1571WcgoTYEV4Ys5ni7LqjBZiTmNNx");

use instructions::*;

#[program]
pub mod root_spot_grid {
    use super::*;

    pub fn initialize_spot_grid_market(
        ctx: Context<InitializeSpotGridMarket>,
        min_order_spacing_bps: u16,
        protocol_fee_per_fill_bps: u16
    ) -> Result<()> {
        instructions::initialize_spot_grid_market(ctx, min_order_spacing_bps, protocol_fee_per_fill_bps)
    }

    pub fn update_spot_grid_market(
        ctx: Context<UpdateSpotGridMarket>,
        new_min_order_spacing_bps: Option<u16>,
        new_protocol_fee_per_fill_bps: Option<u16>
    ) -> Result<()> {
        instructions::update_spot_grid_market(ctx, new_min_order_spacing_bps, new_protocol_fee_per_fill_bps)
    }

}