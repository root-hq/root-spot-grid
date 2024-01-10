use std::collections::HashMap;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token};
use phoenix::program::MarketHeader;
use phoenix::state::Side;
use phoenix::state::markets::FIFOOrderId;

use crate::errors::SpotGridError;
use crate::state::{Market, Position, OrderParams};
use crate::constants::{TRADE_MANAGER_SEED, BASE_TOKEN_VAULT_SEED, QUOTE_TOKEN_VAULT_SEED, POSITION_SEED};
use crate::utils::load_header;

pub fn refresh_orders(ctx: Context<RefreshOrders>) -> Result<()> {

    let market_header = load_header(&ctx.accounts.phoenix_market)?;
    let market_data = ctx.accounts.phoenix_market.data.borrow();
    let (_, market_bytes) = market_data.split_at(std::mem::size_of::<MarketHeader>());
    let market_state =
        phoenix::program::load_with_dispatch(&market_header.market_size_params, market_bytes)
            .map_err(|_| {
                msg!("Failed to deserialize market");
                SpotGridError::PhoenixMarketError
            })?
            .inner;

    // STEP 1 - GET THE ACTIVE ORDERS LIST

    let mut active_orders = ctx.accounts.position.active_orders;
    let mut not_null_counts = 0;

    for order in active_orders {
        if !order.is_null {
            not_null_counts += 1;
        }
    }

    let mut counter = 0;
    let mut fill_map: HashMap<i32, OrderParams> = HashMap::new();

    for order in ctx.accounts.position.active_orders {
        let mut side = Side::Bid;
        if !order.is_bid {
            side = Side::Ask;
        }

        let order_id = FIFOOrderId::new_from_untyped(order.price_in_ticks, order.order_sequence_number);

        if market_state.get_book(side).get(&order_id).is_none() {
            // Order is fully filled.
            fill_map.insert(counter, order);
        }

        counter += 1;
    }


    Ok(())
}

#[derive(Accounts)]
pub struct RefreshOrders<'info> {
    /// CHECK: No constraint needed
    pub cranker: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: No constraint needed
    pub phoenix_market: UncheckedAccount<'info>,

    #[account(
        has_one = phoenix_market,
        has_one = base_token_mint,
        has_one = quote_token_mint
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
    
    /// CHECK: Checked in CPI
    pub log_authority: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in CPI
    pub seat: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in CPI
    pub seat_manager: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in CPI
    pub seat_deposit_collector: UncheckedAccount<'info>,

    pub base_token_mint: Box<Account<'info, Mint>>,

    pub quote_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            POSITION_SEED.as_bytes(),
            position_key.key().as_ref()
        ],
        bump = position.bump,
    )]
    pub position: Box<Account<'info, Position>>,
    
    #[account(
        mut,
        seeds = [BASE_TOKEN_VAULT_SEED.as_bytes(), position.key().as_ref()],
        bump,
        token::mint = base_token_mint,
        token::authority = trade_manager
    )]
    pub base_token_vault_ac: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [QUOTE_TOKEN_VAULT_SEED.as_bytes(), position.key().as_ref()],
        bump,
        token::mint = quote_token_mint,
        token::authority = trade_manager
    )]
    pub quote_token_vault_ac: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    /// CHECK: Checked in CPI
    pub base_phoenix_vault: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Checked in CPI
    pub quote_phoenix_vault: UncheckedAccount<'info>,

    /// CHECK: Checked in CPI
    pub phoenix_program: UncheckedAccount<'info>,

    /// CHECK: Checked in CPI
    pub phoenix_seat_manager_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>,
}