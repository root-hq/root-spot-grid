use anchor_lang::error_code;

#[error_code]
pub enum SpotGridError {
    #[msg("Invalid price range")]
    InvalidPriceRange,
    #[msg("Too many grids")]
    TooManyGrids,
}
