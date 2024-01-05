use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod constants;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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

}