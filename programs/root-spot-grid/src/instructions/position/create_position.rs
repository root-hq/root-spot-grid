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
    let order_size_in_base_lots = args.order_size_in_base_lots.max(ctx.accounts.spot_grid_market.min_order_size_in_base_lots);

    if spacing_per_order_in_ticks < ctx.accounts.spot_grid_market.min_order_spacing_in_ticks {
        spacing_per_order_in_ticks = ctx.accounts.spot_grid_market.min_order_spacing_in_ticks;
        num_grids = args.max_price_in_ticks.checked_sub(args.min_price_in_ticks).unwrap().checked_div(spacing_per_order_in_ticks).unwrap();
    }

    require!(num_grids as usize <= MAX_GRIDS_PER_POSITION, SpotGridError::ExceededMaxNumGrids);

    let mut order_tuples: Vec<(u64, u64)> = vec![];
    let mut left_price_tracker = args.min_price_in_ticks;
    let mut right_price_tracker = args.min_price_in_ticks + spacing_per_order_in_ticks;

    while right_price_tracker <= args.max_price_in_ticks {
        order_tuples.push((left_price_tracker, right_price_tracker));
        left_price_tracker += spacing_per_order_in_ticks;
        right_price_tracker += spacing_per_order_in_ticks;
    }

    let final_min_price_in_ticks = order_tuples[0].0;
    let final_max_price_in_ticks = order_tuples.get(order_tuples.len() - 1).unwrap().1;

    **ctx.accounts.position = Position {
        bump: *ctx.bumps.get("position").unwrap(),
        position_key: ctx.accounts.position_key.key(),
        market: ctx.accounts.spot_grid_market.key(),
        owner: ctx.accounts.creator.key(),
        trade_manager: ctx.accounts.trade_manager.key(),
        position_args: PositionArgs {
            mode: args.mode,
            num_grids,
            min_price_in_ticks: final_min_price_in_ticks,
            max_price_in_ticks: final_max_price_in_ticks,
            order_size_in_base_lots,
        },
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