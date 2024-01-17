use crate::{state::OrderParams, PositionArgs};

pub fn get_order_index_in_buffer(
    order: OrderParams,
    position_args: PositionArgs,
    spacing_in_ticks: u64,
    max_index: i32,
) -> i32 {
    let min_price_in_ticks = position_args.min_price_in_ticks;
    let max_price_in_ticks = position_args.max_price_in_ticks;

    if order.is_bid {
        let index = order
            .price_in_ticks
            .abs_diff(min_price_in_ticks)
            .checked_div(spacing_in_ticks)
            .unwrap() as i32;
        assert!(order.price_in_ticks <= max_price_in_ticks);
        assert!(max_index > index);
        index
    } else {
        let index = order
            .price_in_ticks
            .abs_diff(spacing_in_ticks)
            .checked_div(spacing_in_ticks)
            .unwrap() as i32;
        assert!(order.price_in_ticks >= min_price_in_ticks);
        assert!(max_index > index);
        index
    }
}
