use anchor_lang::prelude::*;

#[derive(Debug, Default)]
#[account]
pub struct SpotGridMarket {
    pub bump: u8,
    pub phoenix_market: Pubkey,
    pub owner: Pubkey,
    pub protocol_fee_recipient: Pubkey,
    
    pub base_token_mint: Pubkey,
    pub quote_token_mint: Pubkey,

    pub min_price_difference_bps: u16,
    pub min_price_difference_pct_hundredths: u16,

    pub claimed_protocol_fee_in_quote_tokens: u64,
    pub unclaimed_protocol_fee_in_quote_tokens: u64,
}

impl SpotGridMarket {
    pub const LEN: usize = 8 + (1 * 8) + (5 * 32) + (2 * 2) + (2 * 8);
}