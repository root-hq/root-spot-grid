use std::collections::{HashMap, HashSet};

use anchor_lang::prelude::*;
use anchor_lang::{
    __private::bytemuck::{self},
    solana_program::program::invoke_signed,
};
use anchor_spl::token::{Mint, Token, TokenAccount};
use phoenix::program::new_order::{
    CondensedOrder, FailedMultipleLimitOrderBehavior, MultipleOrderPacket,
};
use phoenix::program::status::SeatApprovalStatus;
use phoenix::program::{MarketHeader, Seat};
use phoenix::state::markets::FIFOOrderId;
use phoenix::state::markets::OrderId;
use phoenix::state::Side;

use crate::constants::{
    BASE_TOKEN_VAULT_SEED, POSITION_SEED, QUOTE_TOKEN_VAULT_SEED, TRADE_MANAGER_SEED,
};
use crate::errors::RootTradingBotError;
use crate::state::{Market, OrderParams, Position};
use crate::utils::{
    generate_default_grid, get_best_bid_and_ask, get_order_index_in_buffer, load_header,
    parse_order_ids_from_return_data,
};

pub fn refresh_orders(ctx: Context<RefreshOrders>) -> Result<()> {
    let mut bids: Vec<CondensedOrder> = vec![];
    let mut asks: Vec<CondensedOrder> = vec![];

    let mut active_prices_map: HashSet<u64> = HashSet::new();

    let market_header = load_header(&ctx.accounts.phoenix_market)?;
    let market_data = ctx.accounts.phoenix_market.data.borrow();
    let (_, market_bytes) = market_data.split_at(std::mem::size_of::<MarketHeader>());
    let market_state =
        phoenix::program::load_with_dispatch(&market_header.market_size_params, market_bytes)
            .map_err(|_| {
                // msg!("Failed to deserialize market");
                RootTradingBotError::PhoenixMarketError
            })?
            .inner;

    // STEP 1 - Get the last known active orders list and populate into active_price_map

    let active_orders = ctx.accounts.position.active_orders;
    let mut not_null_counts = 0;

    for order in active_orders {
        if !order.is_null {
            active_prices_map.insert(order.price_in_ticks);
            not_null_counts += 1;
        }
    }
    // msg!("Active orders: {:?}", active_prices_map);

    // STEP 2 - Get the untracked filled orders as of now and calculate fees to collect. Discard them from active_price_map

    let mut index_counter = 0;
    let mut fill_map: HashMap<i32, OrderParams> = HashMap::new();

    for order in ctx.accounts.position.active_orders {
        let mut side = Side::Bid;
        if !order.is_bid {
            side = Side::Ask;
        }

        let order_id =
            FIFOOrderId::new_from_untyped(order.price_in_ticks, order.order_sequence_number);

        if market_state.get_book(side).get(&order_id).is_none() {
            // Order is fully filled.
            // msg!("Found fill: {:?}", order);
            active_prices_map.remove(&order.price_in_ticks);
            fill_map.insert(index_counter, order);
        }

        index_counter += 1;
    }

    // STEP 3 - Populate the pending_fills buffer. Need to do this if the fill cannot
    // be counter-filled in the current iteration due to some reason

    for (k, v) in fill_map.iter() {
        ctx.accounts.position.pending_fills[*k as usize] = *v;
    }
    // msg!(
    //     "Pending fills buffer: {:?}",
    //     ctx.accounts.position.pending_fills
    // );

    // STEP 4 - Initialize the bid/ask vectors starting with pending_fills. We keep track of all the new
    // counter-fill prices using active_price_map so that a situation like bid/ask at the same price does not occur

    let spacing_per_order_in_ticks = ctx
        .accounts
        .position
        .position_args
        .max_price_in_ticks
        .checked_sub(ctx.accounts.position.position_args.min_price_in_ticks)
        .unwrap()
        .checked_div(ctx.accounts.position.position_args.num_orders)
        .unwrap();

    let best_bid_ask_prices = get_best_bid_and_ask(market_state);
    let current_market_price = best_bid_ask_prices
        .0
        .checked_add(best_bid_ask_prices.1)
        .unwrap_or(0)
        .checked_div(2)
        .unwrap_or(0);
    // msg!("Current market price: {}", current_market_price);

    for (k, v) in fill_map.iter_mut() {
        let order = *v;
        if order.is_bid {
            if order.order_sequence_number > 0 {
                // msg!("Evaluating bid: {}", order.order_sequence_number);
                let counter_fill_price = order.price_in_ticks + spacing_per_order_in_ticks;
                // msg!("Counter fill price: {}", counter_fill_price);
                if counter_fill_price > current_market_price {
                    if !active_prices_map.contains(&counter_fill_price) {
                        msg!("Can counter fill with an ask");
                        asks.push(CondensedOrder {
                            price_in_ticks: counter_fill_price,
                            size_in_base_lots: order.size_in_base_lots,
                            last_valid_slot: None,
                            last_valid_unix_timestamp_in_seconds: None,
                        });

                        active_prices_map.insert(counter_fill_price);
                        ctx.accounts.position.pending_fills[*k as usize] = OrderParams::default();
                    }
                }
            }
        } else {
            if order.order_sequence_number > 0 {
                // msg!("Evaluating ask: {}", order.order_sequence_number);
                let counter_fill_price = order.price_in_ticks - spacing_per_order_in_ticks;
                // msg!("Counter fill price: {}", counter_fill_price);
                if counter_fill_price < current_market_price {
                    if !active_prices_map.contains(&counter_fill_price) {
                        msg!("Can counter fill with a bid");
                        bids.push(CondensedOrder {
                            price_in_ticks: counter_fill_price,
                            size_in_base_lots: order.size_in_base_lots,
                            last_valid_slot: None,
                            last_valid_unix_timestamp_in_seconds: None,
                        });

                        active_prices_map.insert(counter_fill_price);
                        ctx.accounts.position.pending_fills[*k as usize] = OrderParams::default();
                    }
                }
            }
        }
    }

    // STEP 5 - Lastly, if there were ZERO active orders initially (orders cancelled for some reason)
    // then you need to place new orders making sure the previous pending_fills are prioritized first.
    // That's why this comes at last, and not above in the code.
    if not_null_counts == 0 {
        // msg!("There were zero active orders before. Maybe it was paused");
        let mut order_tuples: Vec<(u64, u64)> = vec![];
        let mut left_price_tracker = ctx.accounts.position.position_args.min_price_in_ticks;
        let mut right_price_tracker =
            ctx.accounts.position.position_args.min_price_in_ticks + spacing_per_order_in_ticks;

        while right_price_tracker <= ctx.accounts.position.position_args.max_price_in_ticks {
            order_tuples.push((left_price_tracker, right_price_tracker));
            left_price_tracker += spacing_per_order_in_ticks;
            right_price_tracker += spacing_per_order_in_ticks;
        }

        let (default_bids, default_asks) = generate_default_grid(
            market_state,
            order_tuples,
            ctx.accounts.position.position_args.order_size_in_base_lots,
        );

        let mut index_counter = 0;
        for bid in default_bids {
            if !active_prices_map.contains(&bid.price_in_ticks) {
                if fill_map.get(&index_counter).unwrap().is_null {
                    active_prices_map.insert(bid.price_in_ticks);
                    bids.push(bid);
                }
            }
            index_counter += 1;
        }

        let mut index_counter = 0;
        for ask in default_asks {
            if !active_prices_map.contains(&ask.price_in_ticks) {
                if fill_map.get(&index_counter).unwrap().is_null {
                    active_prices_map.insert(ask.price_in_ticks);
                    asks.push(ask);
                }
            }
            index_counter += 1;
        }
    }

    // msg!("Final bids: {:?}", bids);
    // msg!("Final asks: {:?}", asks);

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
    // msg!("seat_account length: {}", seat_account.len());

    let mut seat_approval_status = SeatApprovalStatus::NotApproved;

    if seat_account.len() > 0 {
        // msg!("Seat account is not initialized");
        let seat_struct = bytemuck::from_bytes::<Seat>(seat_account.as_ref());

        require!(
            SeatApprovalStatus::from(seat_struct.approval_status) != SeatApprovalStatus::Retired,
            RootTradingBotError::PhoenixVaultSeatRetired
        );

        seat_approval_status = SeatApprovalStatus::from(seat_struct.approval_status);
    }

    // msg!("seat_approval_status set to: {}", seat_approval_status);

    drop(seat_account);
    drop(market_data);

    if seat_approval_status == SeatApprovalStatus::NotApproved {
        // msg!("Not approved so claiming a seat");

        // msg!("trade_manager: {}", ctx.accounts.trade_manager.key());
        // msg!("log auth: {}", ctx.accounts.log_authority.key());
        // msg!("seat: {}", ctx.accounts.seat.key());
        // msg!("seat manager: {}", ctx.accounts.seat_manager.key());
        // msg!(
        //     "seat deposit collector: {}",
        //     ctx.accounts.seat_deposit_collector.key()
        // );

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
    parse_order_ids_from_return_data(&mut order_ids)?;

    let market_data = ctx.accounts.phoenix_market.data.borrow();
    let (_, market_bytes) = market_data.split_at(std::mem::size_of::<MarketHeader>());
    let market_deserialized =
        phoenix::program::load_with_dispatch(&market_header.market_size_params, market_bytes)
            .map_err(|_| {
                msg!("Failed to deserialize market");
                RootTradingBotError::PhoenixMarketError
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
                            size_in_base_lots: ctx
                                .accounts
                                .position
                                .position_args
                                .order_size_in_base_lots,
                            is_bid: false,
                            is_null: false,
                        };
                        // msg!(
                        //     "Ask {} at {}",
                        //     order_id.order_sequence_number,
                        //     order_id.price_in_ticks()
                        // );
                        let index = get_order_index_in_buffer(
                            order_param,
                            ctx.accounts.position.position_args,
                            spacing_per_order_in_ticks,
                        );
                        ctx.accounts.position.active_orders[index as usize] = order_param;
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
                            size_in_base_lots: ctx
                                .accounts
                                .position
                                .position_args
                                .order_size_in_base_lots,
                            is_bid: true,
                            is_null: false,
                        };
                        // msg!(
                        //     "Bid {} at {}",
                        //     order_id.order_sequence_number,
                        //     order_id.price_in_ticks()
                        // );
                        let index = get_order_index_in_buffer(
                            order_param,
                            ctx.accounts.position.position_args,
                            spacing_per_order_in_ticks,
                        );
                        ctx.accounts.position.active_orders[index as usize] = order_param;
                    })
                    .unwrap_or_else(|| msg!("Bid order could not be placed"));
            }
        }
    }

    // msg!("Order params: {:?}", ctx.accounts.position.active_orders);

    Ok(())
}

#[derive(Accounts)]
pub struct RefreshOrders<'info> {
    #[account(mut)]
    /// CHECK: No constraint needed
    pub phoenix_market: UncheckedAccount<'info>,

    #[account(
        has_one = phoenix_market,
        has_one = base_token_mint,
        has_one = quote_token_mint
    )]
    pub bot_market: Box<Account<'info, Market>>,

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
        has_one = bot_market
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
