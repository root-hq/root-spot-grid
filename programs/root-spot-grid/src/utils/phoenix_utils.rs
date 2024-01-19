use std::vec;

use anchor_lang::prelude::*;
use anchor_lang::{
    __private::bytemuck::{self},
    solana_program::program::get_return_data,
};

use phoenix::program::new_order::CondensedOrder;
use phoenix::quantities::WrapperU64;
use phoenix::state::markets::{FIFORestingOrder, Market};
use phoenix::state::OrderPacket;
use phoenix::{program::MarketHeader, state::markets::FIFOOrderId};

use crate::errors::SpotGridError;

#[derive(Clone)]
pub struct PhoenixV1;

impl anchor_lang::Id for PhoenixV1 {
    fn id() -> Pubkey {
        phoenix::id()
    }
}
pub const PHOENIX_MARKET_DISCRIMINANT: u64 = 8167313896524341111;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy)]
pub struct DeserializedFIFOOrderId {
    pub price_in_ticks: u64,
    pub order_sequence_number: u64,
}

pub fn parse_order_ids_from_return_data(order_ids: &mut Vec<FIFOOrderId>) -> Result<()> {
    if let Some((program_id, orders_data)) = get_return_data() {
        msg!("Found return data");
        if program_id == phoenix::id() && !orders_data.is_empty() {
            msg!("Found orders in return data");
            Vec::<DeserializedFIFOOrderId>::try_from_slice(&orders_data)?
                .into_iter()
                .for_each(|o| {
                    order_ids.push(FIFOOrderId::new_from_untyped(
                        o.price_in_ticks,
                        o.order_sequence_number,
                    ))
                });
        } else {
            msg!("No orders in return data");
        }
    }
    Ok(())
}

pub fn load_header(info: &AccountInfo) -> Result<MarketHeader> {
    require!(
        info.owner == &phoenix::id(),
        SpotGridError::InvalidPhoenixProgram
    );
    let data = info.data.borrow();
    let header =
        bytemuck::try_from_bytes::<MarketHeader>(&data[..std::mem::size_of::<MarketHeader>()])
            .map_err(|_| {
                msg!("Failed to parse Phoenix market header");
                SpotGridError::PhoenixMarketError
            })?;
    require!(
        header.discriminant == PHOENIX_MARKET_DISCRIMINANT,
        SpotGridError::InvalidPhoenixProgram,
    );
    Ok(*header)
}

pub fn get_best_bid_and_ask(
    market: &dyn Market<Pubkey, FIFOOrderId, FIFORestingOrder, OrderPacket>,
) -> (u64, u64) {
    let ladder = market.get_ladder(1);
    let best_bid = match ladder.bids.get(0) {
        Some(ladder_order) => ladder_order.price_in_ticks,
        None => 0u64,
    };
    let best_ask = match ladder.asks.get(0) {
        Some(ladder_order) => ladder_order.price_in_ticks,
        None => 0u64,
    };

    (best_bid, best_ask)
}

pub fn generate_default_grid(
    market_state: &dyn Market<Pubkey, FIFOOrderId, FIFORestingOrder, OrderPacket>,
    order_tuples: Vec<(u64, u64)>,
    order_size_in_base_lots: u64,
) -> (Vec<CondensedOrder>, Vec<CondensedOrder>) {
    let mut bids: Vec<CondensedOrder> = vec![];
    let mut asks: Vec<CondensedOrder> = vec![];

    let best_bid_ask_prices = get_best_bid_and_ask(market_state);
    let current_market_price = best_bid_ask_prices
        .0
        .checked_add(best_bid_ask_prices.1)
        .unwrap_or(0)
        .checked_div(2)
        .unwrap_or(0);

    for tuple in order_tuples {
        // If current_market_price is below the range, place an ask order
        // If current_market_price is above the range, place a bid order
        // If current_market_price is between the range, prefer a bid order over an ask order
        if current_market_price < tuple.0 && current_market_price < tuple.1 {
            asks.push(CondensedOrder {
                price_in_ticks: tuple.1,
                size_in_base_lots: order_size_in_base_lots,
                last_valid_slot: None,
                last_valid_unix_timestamp_in_seconds: None,
            });
        } else if current_market_price > tuple.0 && current_market_price > tuple.1 {
            bids.push(CondensedOrder {
                price_in_ticks: tuple.0,
                size_in_base_lots: order_size_in_base_lots,
                last_valid_slot: None,
                last_valid_unix_timestamp_in_seconds: None,
            });
        } else if current_market_price > tuple.0 && current_market_price < tuple.1 {
            // Placing a bid for now
            bids.push(CondensedOrder {
                price_in_ticks: tuple.0,
                size_in_base_lots: order_size_in_base_lots,
                last_valid_slot: None,
                last_valid_unix_timestamp_in_seconds: None,
            });
        }
    }

    (bids, asks)
}

pub fn quote_atoms_from_base_lots_around_price(
    market_account_info: &AccountInfo,
    price_in_ticks: u64,
    size_in_base_lots: u64,
) -> Option<u64> {
    let market_header: Option<MarketHeader> = match load_header(&market_account_info) {
        Ok(header) => Some(header),
        Err(_) => None,
    };

    if market_header.is_none() {
        return None;
    }

    let tick_size_in_quote_atoms_per_base_unit = market_header
        .unwrap()
        .get_tick_size_in_quote_atoms_per_base_unit()
        .as_u64();

    let base_atoms_per_base_lot = market_header.unwrap().get_base_lot_size().as_u64();
    let base_atoms_per_raw_base_unit = 10u64.pow(market_header.unwrap().base_params.decimals);
    let raw_base_units_per_base_unit = market_header.unwrap().raw_base_units_per_base_unit.max(1);

    if !((base_atoms_per_raw_base_unit * raw_base_units_per_base_unit as u64)
        % base_atoms_per_base_lot
        == 0)
    {
        return None;
    }

    let num_base_lots_per_base_unit = (base_atoms_per_raw_base_unit
        * raw_base_units_per_base_unit as u64)
        / base_atoms_per_base_lot;

    let quote_atoms_needed = price_in_ticks
        .checked_mul(tick_size_in_quote_atoms_per_base_unit)
        .unwrap()
        .checked_mul(size_in_base_lots)
        .unwrap()
        .checked_div(num_base_lots_per_base_unit);

    quote_atoms_needed
}
