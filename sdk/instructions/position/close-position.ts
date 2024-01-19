import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getBaseTokenVaultAddress, getQuoteTokenVaultAddress, getRootProgram, getTradeManagerAddress, requestComputeUnits } from "../../utils";
import { Market, Position } from "../../types";
import * as Phoenix from "@ellipsis-labs/phoenix-sdk";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export interface ClosePositionArgs extends WriteActionArgs {
    spotGridMarketAddress: anchor.web3.PublicKey;
    positionAddress: anchor.web3.PublicKey;
    baseTokenUserAc: anchor.web3.PublicKey;
    quoteTokenUserAc: anchor.web3.PublicKey;
}

export interface ClosePositionResult extends WriteActionResult {
    positionAddress: anchor.web3.PublicKey;
}

export const closePosition = async({
    provider,
    spotGridMarketAddress,
    positionAddress,
    baseTokenUserAc,
    quoteTokenUserAc,
}: ClosePositionArgs): Promise<ClosePositionResult> => {
    let rootProgram = getRootProgram(provider);

    const market = await rootProgram.account.market.fetch(spotGridMarketAddress) as Market;
    const position = await rootProgram.account.position.fetch(positionAddress) as Position;
    console.log("Position key: ", position.positionKey.toString());

    const phoenixMarket = market.phoenixMarket;
    const baseTokenMint = market.baseTokenMint;
    const quoteTokenMint = market.quoteTokenMint;
    
    const baseTokenVaultAc = getBaseTokenVaultAddress(positionAddress);
    const quoteTokenVaultAc = getQuoteTokenVaultAddress(positionAddress);

    const baseTokenFeeAc = await getAssociatedTokenAddress(baseTokenMint, market.protocolFeeRecipient);
    const quoteTokenFeeAc = await getAssociatedTokenAddress(quoteTokenMint, market.protocolFeeRecipient);

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

    const additionalUnitsIx = requestComputeUnits(1_400_000, 1);
    transaction.add(...additionalUnitsIx);

    try {
        const ix = await rootProgram
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
                quoteTokenVaultAc,
                baseTokenFeeAc,
                quoteTokenFeeAc
            })
            .instruction();

        transaction.add(ix);
        
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