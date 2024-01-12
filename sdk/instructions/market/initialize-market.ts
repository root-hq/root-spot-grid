import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getRootProgram, getSpotGridMarketAddress } from "../../utils";

export interface InitializeMarketArgs extends WriteActionArgs {
    phoenixMarket: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    protocolFeeRecipient: anchor.web3.PublicKey;
    baseTokenMint: anchor.web3.PublicKey;
    quoteTokenMint: anchor.web3.PublicKey;
    protocolFeePerFillBps: number;
    minOrderSpacingInTicks: anchor.BN;
    minOrderSizeInBaseLots: anchor.BN;
}

export interface InitializeMarketResult extends WriteActionResult {
    spotGridMarketAddress: anchor.web3.PublicKey;
    spotGridMarketKey: anchor.web3.PublicKey;
}

export const initializeMarket = async({
    provider,
    phoenixMarket,
    owner,
    protocolFeeRecipient,
    baseTokenMint,
    quoteTokenMint,
    protocolFeePerFillBps,
    minOrderSpacingInTicks,
    minOrderSizeInBaseLots
}: InitializeMarketArgs): Promise<InitializeMarketResult> => {
    let rootProgram = getRootProgram(provider);

    let spotGridMarketKeypair = anchor.web3.Keypair.generate();

    let spotGridMarketAddress = getSpotGridMarketAddress(phoenixMarket, spotGridMarketKeypair.publicKey);

    const transaction = new anchor.web3.Transaction();

    try {
        const ix = await rootProgram
            .methods
            .initializeMarket(protocolFeePerFillBps, minOrderSpacingInTicks, minOrderSizeInBaseLots)
            .accounts({
                owner,
                phoenixMarket,
                spotGridMarketKey: spotGridMarketKeypair.publicKey,
                protocolFeeRecipient,
                market: spotGridMarketAddress,
                baseTokenMint,
                quoteTokenMint
            })
            .instruction();

        transaction.add(ix);
        
        return {
            spotGridMarketAddress,
            spotGridMarketKey: spotGridMarketKeypair.publicKey,
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