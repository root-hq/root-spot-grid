use anchor_lang::prelude::*;
use anchor_lang::{
    __private::bytemuck::{self},
    solana_program::program::get_return_data,
};

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
