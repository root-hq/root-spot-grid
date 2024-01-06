use anchor_lang::prelude::*;

use crate::state::{Market, Position, OrderParams, PositionArgs};
use crate::constants::{POSITION_SEED, MAX_GRIDS_PER_POSITION};
use crate::errors::SpotGridError;

pub fn create_position(
    ctx: Context<CreatePosition>,
    args: PositionArgs
) -> Result<()> {
    
    require!(args.min_price_in_ticks < args.max_price_in_ticks, SpotGridError::InvalidPriceRange);

    require!(args.max_price_in_ticks - args.min_price_in_ticks >= ctx.accounts.spot_grid_market.min_order_spacing_in_ticks, SpotGridError::InvalidPriceRange);

    require!(args.num_grids as usize <= MAX_GRIDS_PER_POSITION, SpotGridError::TooManyGrids);

    **ctx.accounts.position = Position {
        bump: *ctx.bumps.get("position").unwrap(),
        position_key: ctx.accounts.position_key.key(),
        market: ctx.accounts.spot_grid_market.key(),
        owner: ctx.accounts.creator.key(),
        position_args: args,
        fee_growth_base: 0,
        fee_growth_quote: 0,
        active_orders: [OrderParams::default(); MAX_GRIDS_PER_POSITION]
    };

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePosition<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: No constraint needed
    pub phoenix_market: UncheckedAccount<'info>,

    #[account(
        has_one = phoenix_market
    )]
    pub spot_grid_market: Box<Account<'info, Market>>,

    /// CHECK: No constraint needed
    pub position_key: UncheckedAccount<'info>,

    #[account(
        init,
        seeds = [
            POSITION_SEED.as_bytes(),
            position_key.key().as_ref()
        ],
        bump,
        space = Position::LEN,
        payer = creator
    )]
    pub position: Box<Account<'info, Position>>,

    pub system_program: Program<'info, System>,
}