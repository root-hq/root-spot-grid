import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getBaseTokenVaultAddress, getPositionAddress, getQuoteTokenVaultAddress, getRootProgram, getSpotGridMarketAddress, getTradeManagerAddress } from "../../utils";
import { Market, PositionArgs } from "../../types";

export interface CreatePositionArgs extends WriteActionArgs {
    spotGridMarketAddress: anchor.web3.PublicKey;
    baseTokenUserAc: anchor.web3.PublicKey;
    quoteTokenUserAc: anchor.web3.PublicKey;
    positionArgs: PositionArgs
}

export interface CreatePositionResult extends WriteActionResult {
    positionAddress: anchor.web3.PublicKey;
}

export const createPosition = async({
    provider,
    spotGridMarketAddress,
    baseTokenUserAc,
    quoteTokenUserAc,
    positionArgs
}: CreatePositionArgs): Promise<CreatePositionResult> => {
    let rootProgram = getRootProgram(provider);

    const positionKey = anchor.web3.Keypair.generate();

    const market = await rootProgram.account.market.fetch(spotGridMarketAddress) as Market;

    const phoenixMarket = market.phoenixMarket;
    const tradeManager = getTradeManagerAddress(spotGridMarketAddress);
    const baseTokenMint = market.baseTokenMint;
    const quoteTokenMint = market.quoteTokenMint;

    const positionAddress = getPositionAddress(positionKey.publicKey);
    
    const baseTokenVaultAc = getBaseTokenVaultAddress(spotGridMarketAddress);
    const quoteTokenVaultAc = getQuoteTokenVaultAddress(spotGridMarketAddress);

    const transaction = new anchor.web3.Transaction();

    try {
        const ix = await rootProgram
            .methods
            .createPosition(positionArgs)
            .accounts({
                creator: provider.wallet.publicKey,
                phoenixMarket,
                spotGridMarket: spotGridMarketAddress,
                positionKey: positionKey.publicKey,
                position: positionAddress,
                tradeManager,
                baseTokenMint,
                quoteTokenMint,
                baseTokenUserAc,
                quoteTokenUserAc,
                baseTokenVaultAc,
                quoteTokenVaultAc
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