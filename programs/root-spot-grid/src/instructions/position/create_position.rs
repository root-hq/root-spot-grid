use anchor_lang::prelude::*;
use anchor_lang::{
    __private::bytemuck::{self},
    solana_program::program::{invoke, invoke_signed},
};
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use phoenix::program::new_order::{FailedMultipleLimitOrderBehavior, MultipleOrderPacket};
use phoenix::program::status::SeatApprovalStatus;
use phoenix::program::{MarketHeader, Seat};
use phoenix::quantities::WrapperU64;
use phoenix::state::markets::OrderId;
use phoenix::state::Side;

use crate::constants::*;
use crate::errors::SpotGridError;
use crate::state::{Market, OrderParams, Position, PositionArgs};
use crate::utils::{generate_default_grid, load_header, parse_order_ids_from_return_data, get_order_index_in_buffer};

pub fn create_position(ctx: Context<CreatePosition>, args: PositionArgs) -> Result<()> {
    // STEP 1 - Perform validation checks on the args passed and modify them if necessary

    require!(
        args.min_price_in_ticks < args.max_price_in_ticks,
        SpotGridError::InvalidPriceRange
    );

    let mut num_grids = args.num_grids;
    let mut spacing_per_order_in_ticks = args
        .max_price_in_ticks
        .checked_sub(args.min_price_in_ticks)
        .unwrap()
        .checked_div(num_grids)
        .unwrap();
    let order_size_in_base_lots = args
        .order_size_in_base_lots
        .max(ctx.accounts.spot_grid_market.min_order_size_in_base_lots);

    if spacing_per_order_in_ticks < ctx.accounts.spot_grid_market.min_order_spacing_in_ticks {
        spacing_per_order_in_ticks = ctx.accounts.spot_grid_market.min_order_spacing_in_ticks;
        num_grids = args
            .max_price_in_ticks
            .checked_sub(args.min_price_in_ticks)
            .unwrap()
            .checked_div(spacing_per_order_in_ticks)
            .unwrap();
    }

    require!(
        num_grids as usize <= MAX_GRIDS_PER_POSITION,
        SpotGridError::ExceededMaxNumGrids
    );

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

    // STEP 2 - Deserialize the current market state and generate bid/ask orders

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

    let (bids, asks) = generate_default_grid(market_state, order_tuples, order_size_in_base_lots);

    // STEP 3 - Calculate and transfer the amount required by the trade_manager to be able to place
    //          orders successfully in the future

    let mut base_token_amount = 0u64;
    let mut quote_token_amount = 0u64;

    let tick_size_in_quote_atoms_per_base_unit = market_header
        .get_tick_size_in_quote_atoms_per_base_unit()
        .as_u64();

    let base_atoms_per_base_lot = market_header.get_base_lot_size().as_u64();
    let base_atoms_per_raw_base_unit = 10u64.pow(market_header.base_params.decimals);
    let raw_base_units_per_base_unit = market_header.raw_base_units_per_base_unit.max(1);
    require!(
        (base_atoms_per_raw_base_unit * raw_base_units_per_base_unit as u64)
            % base_atoms_per_base_lot
            == 0,
        SpotGridError::InvalidBaseLotSize
    );
    let num_base_lots_per_base_unit = (base_atoms_per_raw_base_unit
        * raw_base_units_per_base_unit as u64)
        / base_atoms_per_base_lot;

    for bid in &bids {
        let quote_atoms_needed = bid
            .price_in_ticks
            .checked_mul(tick_size_in_quote_atoms_per_base_unit)
            .unwrap()
            .checked_mul(bid.size_in_base_lots)
            .unwrap()
            .checked_div(num_base_lots_per_base_unit)
            .unwrap();
        quote_token_amount += quote_atoms_needed;
    }

    for ask in &asks {
        base_token_amount += ask.size_in_base_lots * base_atoms_per_base_lot;
    }

    msg!("Spot grid trading strategy");
    msg!("Market: {:?}", ctx.accounts.phoenix_market.key());
    msg!("Position args: {:?}", args);
    msg!("Generated bids: {:?}", bids);
    msg!("Generated asks: {:?}", asks);
    msg!("Base tokens to deposit: {:?}", base_token_amount);
    msg!("Quote tokens to deposit: {:?}", quote_token_amount);

    // STEP 4 - Transfer the calculated amount to the trade_manager

    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.base_token_user_ac.to_account_info(),
                to: ctx.accounts.base_token_vault_ac.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        ),
        base_token_amount,
    )?;

    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.quote_token_user_ac.to_account_info(),
                to: ctx.accounts.quote_token_vault_ac.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        ),
        quote_token_amount,
    )?;

    // STEP 5 - Transfer some SOL to trade_manager for seat initialization later

    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.creator.key(),
        &ctx.accounts.trade_manager.key(),
        SEAT_INITIALIZATION_LAMPORTS,
    );
    invoke(
        &transfer_ix,
        &[
            ctx.accounts.creator.to_account_info(),
            ctx.accounts.trade_manager.to_account_info(),
        ],
    )?;

    // STEP 6 - Prepare signer seeds for the next CPI calls

    let trade_manager_bump = *ctx.bumps.get("trade_manager").unwrap();

    let position_address = ctx.accounts.position.key();

    let trade_manager_seeds = &[
        TRADE_MANAGER_SEED.as_bytes(),
        position_address.as_ref(),
        &[trade_manager_bump],
    ];
    let trade_manager_signer_seeds = &[&trade_manager_seeds[..]];

    // STEP 7 - Acquire a seat if necessary

    let seat_account = ctx.accounts.seat.data.borrow();
    msg!("seat_account length: {}", seat_account.len());

    let mut seat_approval_status = SeatApprovalStatus::NotApproved;

    if seat_account.len() > 0 {
        msg!("Seat account is not initialized");
        let seat_struct = bytemuck::from_bytes::<Seat>(seat_account.as_ref());

        require!(
            SeatApprovalStatus::from(seat_struct.approval_status) != SeatApprovalStatus::Retired,
            SpotGridError::PhoenixVaultSeatRetired
        );

        seat_approval_status = SeatApprovalStatus::from(seat_struct.approval_status);
    }

    msg!("seat_approval_status set to: {}", seat_approval_status);

    if seat_approval_status == SeatApprovalStatus::NotApproved {
        msg!("Not approved so claiming a seat");

        drop(seat_account);
        drop(market_data);

        msg!("trade_manager: {}", ctx.accounts.trade_manager.key());
        msg!("log auth: {}", ctx.accounts.log_authority.key());
        msg!("seat: {}", ctx.accounts.seat.key());
        msg!("seat manager: {}", ctx.accounts.seat_manager.key());
        msg!(
            "seat deposit collector: {}",
            ctx.accounts.seat_deposit_collector.key()
        );

        invoke_signed(
            &phoenix_seat_manager::instruction_builders::create_claim_seat_instruction(
                &ctx.accounts.trade_manager.key(),
                &ctx.accounts.phoenix_market.key(),
            ),
            &[
                ctx.accounts.phoenix_program.to_account_info(),
                ctx.accounts.log_authority.to_account_info(),
                ctx.accounts.phoenix_market.to_account_info(),
                ctx.accounts.seat_manager.to_account_info(),
                ctx.accounts.seat_deposit_collector.to_account_info(),
                ctx.accounts.trade_manager.to_account_info(),
                ctx.accounts.seat.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            trade_manager_signer_seeds,
        )?;
    }

    // STEP 8 - Place post only orders

    let mut order_ids = vec![];

    let client_order_id = u128::from_le_bytes(
        ctx.accounts.trade_manager.key().to_bytes()[..16]
            .try_into()
            .unwrap(),
    );

    let mut multiple_order_packet =
        MultipleOrderPacket::new(bids, asks, Some(client_order_id), false);

    multiple_order_packet.failed_multiple_limit_order_behavior =
        FailedMultipleLimitOrderBehavior::SkipOnInsufficientFundsAndAmendOnCross;

    invoke_signed(
        &phoenix::program::create_new_multiple_order_instruction_with_custom_token_accounts(
            &ctx.accounts.phoenix_market.key(),
            &ctx.accounts.trade_manager.key(),
            &ctx.accounts.base_token_vault_ac.key(),
            &ctx.accounts.quote_token_vault_ac.key(),
            &ctx.accounts.base_token_mint.key(),
            &ctx.accounts.quote_token_mint.key(),
            &multiple_order_packet,
        ),
        &[
            ctx.accounts.phoenix_program.to_account_info(),
            ctx.accounts.log_authority.to_account_info(),
            ctx.accounts.phoenix_market.to_account_info(),
            ctx.accounts.trade_manager.to_account_info(),
            ctx.accounts.seat.to_account_info(),
            ctx.accounts.base_token_vault_ac.to_account_info(),
            ctx.accounts.quote_token_vault_ac.to_account_info(),
            ctx.accounts.base_phoenix_vault.to_account_info(),
            ctx.accounts.quote_phoenix_vault.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        trade_manager_signer_seeds,
    )?;

    // STEP 9 - Assign the position state to the PDA
    let mut orders_params = [OrderParams::default(); 15];

    let new_args = PositionArgs {
        mode: args.mode,
        num_grids,
        min_price_in_ticks: final_min_price_in_ticks,
        max_price_in_ticks: final_max_price_in_ticks,
        order_size_in_base_lots,
    };

    parse_order_ids_from_return_data(&mut order_ids)?;

    let market_data = ctx.accounts.phoenix_market.data.borrow();
    let (_, market_bytes) = market_data.split_at(std::mem::size_of::<MarketHeader>());
    let market_deserialized =
        phoenix::program::load_with_dispatch(&market_header.market_size_params, market_bytes)
            .map_err(|_| {
                msg!("Failed to deserialize market");
                SpotGridError::PhoenixMarketError
            })?
            .inner;

    for order_id in order_ids.iter() {
        let side = Side::from_order_sequence_number(order_id.order_sequence_number);
        match side {
            Side::Ask => {
                market_deserialized
                    .get_book(Side::Ask)
                    .get(&order_id)
                    .map(|_| {
                        let order_param = OrderParams {
                            price_in_ticks: order_id.price_in_ticks(),
                            order_sequence_number: order_id.order_sequence_number,
                            size_in_base_lots: order_size_in_base_lots,
                            is_bid: false,
                            is_null: false,
                        };
                        msg!("Ask {} at {}", order_id.order_sequence_number, order_id.price_in_ticks());
                        let index = get_order_index_in_buffer(
                            order_param,
                            new_args,
                            spacing_per_order_in_ticks
                        );
                        orders_params[index as usize] = order_param;
                    })
                    .unwrap_or_else(|| msg!("Ask order could not be placed"));
            }
            Side::Bid => {
                market_deserialized
                    .get_book(Side::Bid)
                    .get(&order_id)
                    .map(|_| {
                        let order_param = OrderParams {
                            price_in_ticks: order_id.price_in_ticks(),
                            order_sequence_number: order_id.order_sequence_number,
                            size_in_base_lots: order_size_in_base_lots,
                            is_bid: true,
                            is_null: false,
                        };
                        msg!("Bid {} at {}", order_id.order_sequence_number, order_id.price_in_ticks());
                        let index = get_order_index_in_buffer(
                            order_param,
                            new_args,
                            spacing_per_order_in_ticks,
                        );
                        orders_params[index as usize] = order_param;
                    })
                    .unwrap_or_else(|| msg!("Bid order could not be placed"));
            }
        }
    }

    msg!("Order params: {:?}", orders_params);

    **ctx.accounts.position = Position {
        bump: *ctx.bumps.get("position").unwrap(),
        position_key: ctx.accounts.position_key.key(),
        market: ctx.accounts.spot_grid_market.key(),
        owner: ctx.accounts.creator.key(),
        trade_manager: ctx.accounts.trade_manager.key(),
        position_args: new_args,
        fee_growth_base: 0,
        fee_growth_quote: 0,
        active_orders: orders_params,
        pending_fills: [OrderParams::default(); MAX_GRIDS_PER_POSITION],
    };

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePosition<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

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

    #[account(mut)]
    pub base_token_user_ac: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub quote_token_user_ac: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = creator,
        seeds = [BASE_TOKEN_VAULT_SEED.as_bytes(), position.key().as_ref()],
        bump,
        token::mint = base_token_mint,
        token::authority = trade_manager
    )]
    pub base_token_vault_ac: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = creator,
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
