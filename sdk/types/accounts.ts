import { OrderParams, PositionArgs } from "./args";
import * as anchor from "@coral-xyz/anchor";

export interface Position {
    bump: number;
    positionKey: anchor.web3.PublicKey;
    market: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    tradeManager: anchor.web3.PublicKey;

    positionArgs: PositionArgs;
    feeGrowthBase: anchor.BN;
    feeGrowthQuote: anchor.BN;
    activeOrders: OrderParams[]
}

export interface Market {
    bump: number;
    phoenixMarket: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    protocolFeeRecipient: anchor.web3.PublicKey;
    baseTokenMint: anchor.web3.PublicKey;
    quoteTokenMint: anchor.web3.PublicKey;
    protocolFeePerFillBps: number;
    minOrderSpacingInTicks: anchor.BN;
    minOrderSizeInBaseLots: anchor.BN;
    claimedProtocolFeeInQuoteTokens: anchor.BN;
    unclaimedProtocolFeeInQuoteTokens: anchor.BN;
}