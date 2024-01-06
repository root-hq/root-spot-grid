use anchor_lang::prelude::*;

use crate::state::{Market, Position, OrderParams, PositionArgs};
use crate::constants::{POSITION_SEED, MAX_GRIDS_PER_POSITION, TRADE_MANAGER_SEED};
use crate::errors::SpotGridError;

pub fn create_position(
    ctx: Context<CreatePosition>,
    args: PositionArgs
) -> Result<()> {
    
    require!(args.min_price_in_ticks < args.max_price_in_ticks, SpotGridError::InvalidPriceRange);

    let mut num_grids = args.num_grids;
    let mut spacing_per_order_in_ticks = args.max_price_in_ticks.checked_sub(args.min_price_in_ticks).unwrap().checked_div(num_grids).unwrap();

    if spacing_per_order_in_ticks < ctx.accounts.spot_grid_market.min_order_spacing_in_ticks {
        spacing_per_order_in_ticks = ctx.accounts.spot_grid_market.min_order_spacing_in_ticks;
        num_grids = args.max_price_in_ticks.checked_sub(args.min_price_in_ticks).unwrap().checked_div(spacing_per_order_in_ticks).unwrap();
    }

    require!(num_grids as usize <= MAX_GRIDS_PER_POSITION, SpotGridError::ExceededMaxNumGrids);

    require!(args.order_size_in_base_lots >= ctx.accounts.spot_grid_market.min_order_size_in_base_lots, SpotGridError::InvalidOrderSize);

    // TODO - Add a check that the current price is not equal to min/max price of the grid

    **ctx.accounts.position = Position {
        bump: *ctx.bumps.get("position").unwrap(),
        position_key: ctx.accounts.position_key.key(),
        market: ctx.accounts.spot_grid_market.key(),
        owner: ctx.accounts.creator.key(),
        trade_manager: ctx.accounts.trade_manager.key(),
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
        mut,
        seeds = [
            TRADE_MANAGER_SEED.as_bytes(),
            position.key().as_ref(),
        ],
        bump,
    )]
    /// CHECK: No constraint needed
    pub trade_manager: UncheckedAccount<'info>,

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