import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getBaseTokenVaultAddress, getPositionAddress, getQuoteTokenVaultAddress, getRootProgram, getTradeManagerAddress, requestComputeUnits } from "../../utils";
import { Market, Position, PositionArgs } from "../../types";
import * as Phoenix from "@ellipsis-labs/phoenix-sdk";
import { PHOENIX_SEAT_MANAGER_PROGRAM_ID } from "../../constants";

export interface CancelOrdersAndClosePositionArgs extends WriteActionArgs {
    spotGridMarketAddress: anchor.web3.PublicKey;
    positionAddress: anchor.web3.PublicKey;
    baseTokenUserAc: anchor.web3.PublicKey;
    quoteTokenUserAc: anchor.web3.PublicKey;
}

export interface CancelOrdersAndClosePositionResult extends WriteActionResult {
    positionAddress: anchor.web3.PublicKey;
}

export const cancelOrdersAndClosePosition = async({
    provider,
    spotGridMarketAddress,
    positionAddress,
    baseTokenUserAc,
    quoteTokenUserAc,
}: CancelOrdersAndClosePositionArgs): Promise<CancelOrdersAndClosePositionResult> => {
    let rootProgram = getRootProgram(provider);

    const market = await rootProgram.account.market.fetch(spotGridMarketAddress) as Market;
    const position = await rootProgram.account.position.fetch(positionAddress) as Position;
    console.log("Position key: ", position.positionKey.toString());

    const phoenixMarket = market.phoenixMarket;
    const baseTokenMint = market.baseTokenMint;
    const quoteTokenMint = market.quoteTokenMint;
    
    const baseTokenVaultAc = getBaseTokenVaultAddress(positionAddress);
    const quoteTokenVaultAc = getQuoteTokenVaultAddress(positionAddress);
    const tradeManager = getTradeManagerAddress(positionAddress);

    const phoenixClient = await Phoenix.Client.createWithMarketAddresses(
        provider.connection,
        [phoenixMarket]
      );
    
    await phoenixClient.addMarket(phoenixMarket.toBase58());
    const phoenixMarketState = phoenixClient.marketStates.get(phoenixMarket.toBase58());

    const logAuthority = Phoenix.getLogAuthority();
    const basePhoenixVault = phoenixMarketState.data.header.baseParams.vaultKey;
    const quotePhoenixVault = phoenixMarketState.data.header.quoteParams.vaultKey;
    
    const transaction = new anchor.web3.Transaction();

    const additionalUnitsIx = requestComputeUnits(1_400_000, 100);
    transaction.add(...additionalUnitsIx);

    try {

        const cancelIx = await rootProgram
            .methods
            .cancelOrders()
            .accounts({
                creator: provider.wallet.publicKey,
                phoenixMarket,
                positionKey: position.positionKey,
                logAuthority,
                tradeManager,
                baseTokenMint,
                quoteTokenMint,
                position: positionAddress,
                baseTokenVaultAc,
                quoteTokenVaultAc,
                basePhoenixVault,
                quotePhoenixVault,
                phoenixProgram: Phoenix.PROGRAM_ADDRESS
            })
            .instruction();

        transaction.add(cancelIx);

        const closeIx = await rootProgram
            .methods
            .closePosition()
            .accounts({
                creator: provider.wallet.publicKey,
                phoenixMarket,
                positionKey: position.positionKey,
                tradeManager,
                baseTokenMint,
                quoteTokenMint,
                position: positionAddress,
                baseTokenUserAc,
                quoteTokenUserAc,
                baseTokenVaultAc,
                quoteTokenVaultAc
            })
            .instruction();

        transaction.add(closeIx);
        
        return {
            positionAddress,
            transactionInfos: [
                {
                    transaction
                }
            ]
        }
    }
    catch(err) {
        console.log(`Err: ${err}`);
    }
}