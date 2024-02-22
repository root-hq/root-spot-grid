use anchor_lang::error_code;

#[error_code]
pub enum RootTradingBotError {
    #[msg("Invalid price range")]
    InvalidPriceRange,
    #[msg("Exceeded number of orders limit")]
    ExceededMaxNumOrders,
    #[msg("Order size less than minimum size required")]
    InvalidOrderSize,
    #[msg("Phoenix program id invalid")]
    InvalidPhoenixProgram,
    #[msg("Phoenix market deserialization error")]
    PhoenixMarketError,
    #[msg("Phoenix vault seat Retired")]
    PhoenixVaultSeatRetired,
    #[msg("Invalid base lot size")]
    InvalidBaseLotSize,
    #[msg("Pending open orders before closure")]
    PendingOpenOrders,
}
