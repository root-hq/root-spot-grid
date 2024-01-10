use crate::constants::MAX_GRIDS_PER_POSITION;
use anchor_lang::prelude::*;

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct OrderParams {
    pub order_sequence_number: u64,
    pub price_in_ticks: u64,
    pub size_in_base_lots: u64,
    pub is_bid: bool,
    pub is_null: bool,
}

impl OrderParams {
    pub const LEN: usize = (3 * 8) + (2 * 1);
}

impl Default for OrderParams {
    fn default() -> Self {
        OrderParams {
            order_sequence_number: 0u64,
            price_in_ticks: 0u64,
            size_in_base_lots: 0u64,
            is_bid: true,
            is_null: true,
        }
    }
}

#[derive(Debug, AnchorDeserialize, AnchorSerialize, Clone, Copy)]
pub enum Mode {
    Arithmetic,
    Geometric,
}

impl Default for Mode {
    fn default() -> Self {
        Mode::Arithmetic
    }
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct PositionArgs {
    pub mode: Mode,
    pub num_grids: u64,
    pub min_price_in_ticks: u64,
    pub max_price_in_ticks: u64,
    pub order_size_in_base_lots: u64,
}

impl PositionArgs {
    pub const LEN: usize = 8 + (1 * 2) + (4 * 8);
}

#[derive(Debug, Default)]
#[account]
pub struct Position {
    pub bump: u8,
    pub position_key: Pubkey,
    pub market: Pubkey,
    pub owner: Pubkey,
    pub trade_manager: Pubkey,

    pub position_args: PositionArgs,

    pub fee_growth_base: u64,
    pub fee_growth_quote: u64,

    pub active_orders: [OrderParams; MAX_GRIDS_PER_POSITION],
    pub pending_fills: [OrderParams; MAX_GRIDS_PER_POSITION],
}

impl Position {
    pub const LEN: usize = 8
        + (1 * 2)
        + (4 * 32)
        + PositionArgs::LEN
        + (2 * 8)
        + (2 * MAX_GRIDS_PER_POSITION * OrderParams::LEN);
}
