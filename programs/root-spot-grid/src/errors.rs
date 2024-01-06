use anchor_lang::error_code;

#[error_code]
pub enum SpotGridError {
    #[msg("Invalid price range")]
    InvalidPriceRange,
    #[msg("Exceeded number of grids limit")]
    ExceededMaxNumGrids,
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

}
