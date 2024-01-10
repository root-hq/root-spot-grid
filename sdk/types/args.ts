import * as anchor from "@coral-xyz/anchor";

export interface OrderParams {
    orderSequenceNumber: anchor.BN;
    priceInTicks: anchor.BN;
    sizeInBaseLots: anchor.BN;
    isBid: boolean;
    isNull: boolean;
}

export enum Mode {
    Arithmetic,
    Geometric
}

export type ModeObject = {
    arithmetic: {};
} | {
    geometric: {};
}

export const getModeObject = (mode: Mode): ModeObject => {
    switch (mode) {
        case Mode.Arithmetic: {
            return {
                arithmetic: {}
            }
        }
        case Mode.Geometric: {
            return {
                geometric: {}
            }
        }
    }
}

export interface PositionArgs {
    mode: ModeObject;
    numGrids: anchor.BN;
    minPriceInTicks: anchor.BN;
    maxPriceInTicks: anchor.BN;
    orderSizeInBaseLots: anchor.BN;
}