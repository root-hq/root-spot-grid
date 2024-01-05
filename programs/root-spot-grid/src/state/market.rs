use anchor_lang::prelude::*;

#[derive(Debug, Default)]
#[account]
pub struct Market {
    pub bump: u8,
    pub phoenix_market: Pubkey,
    pub owner: Pubkey,
    pub protocol_fee_recipient: Pubkey,
    
    pub base_token_mint: Pubkey,
    pub quote_token_mint: Pubkey,

    pub min_order_spacing_bps: u16,
    pub protocol_fee_per_fill_bps: u16,

    pub min_order_size_in_base_lots: u64,
    pub claimed_protocol_fee_in_quote_tokens: u64,
    pub unclaimed_protocol_fee_in_quote_tokens: u64,
}

impl Market {
    pub const LEN: usize = 8 + (1 * 8) + (5 * 32) + (2 * 2) + (3 * 8);
}