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
        min_price_difference_bps: u16,
        min_price_difference_pct_hundredths: u16
    ) -> Result<()> {
        instructions::initialize_spot_grid_market(ctx, min_price_difference_bps, min_price_difference_pct_hundredths)
    }

    pub fn update_spot_grid_market(
        ctx: Context<UpdateSpotGridMarket>,
        new_min_price_difference_bps: u16,
        new_min_price_difference_pct_hundredths: u16
    ) -> Result<()> {
        instructions::update_spot_grid_market(ctx, new_min_price_difference_bps, new_min_price_difference_pct_hundredths)
    }

}