use anchor_lang::prelude::*;
use crate::constants::MAX_GRIDS_PER_POSITION;

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct OrderParams {
    pub order_sequence_number: u64,
    pub price_in_ticks: u64,
    pub size_in_base_lots: u64,
    pub is_bid: bool,
}

#[derive(Debug, AnchorDeserialize, AnchorSerialize, Clone, Copy)]
pub enum Mode {
    Arithmetic,
    Geometric
}

impl Default for Mode {
    fn default() -> Self {
        Mode::Arithmetic
    }
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct PositionArgs {
    pub mode: Mode,
    pub num_grids: u16,
    pub min_price_in_ticks: u64,
    pub max_price_in_ticks: u64,
}


#[derive(Debug, Default)]
#[account]
pub struct Position {
    pub bump: u8,
    pub position_key: Pubkey,
    pub market: Pubkey,
    pub owner: Pubkey,

    pub position_args: PositionArgs,
    
    pub fee_growth_base: u64,
    pub fee_growth_quote: u64,
    
    pub active_orders: [OrderParams; MAX_GRIDS_PER_POSITION]
}

impl Position {
    pub const LEN: usize = 8 + (1 * 2) + (3 * 32) + (2 * 2) + (4 * 8) + (15 * 17);
}