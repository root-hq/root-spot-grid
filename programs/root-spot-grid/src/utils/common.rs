use crate::{state::OrderParams, PositionArgs};

pub fn get_order_index_in_buffer(
    order: OrderParams,
    position_args: PositionArgs,
    spacing_in_ticks: u64,
) -> i32 {
    let min_price_in_ticks = position_args.min_price_in_ticks;
    let max_price_in_ticks = position_args.max_price_in_ticks;

    let mut index = order
            .price_in_ticks
            .abs_diff(min_price_in_ticks)
            .checked_div(spacing_in_ticks)
            .unwrap() as i32;

    if order.is_bid {
        assert!(order.price_in_ticks < max_price_in_ticks);
        assert!(position_args.num_grids as i32 > index);
        index
    } else {
        index -= 1;
        assert!(order.price_in_ticks > min_price_in_ticks);
        assert!(position_args.num_grids as i32 > index);
        index
    }
}
