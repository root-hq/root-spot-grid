import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getRootProgram, getSpotGridMarketAddress } from "../../utils";

export interface UpdateMarketArgs extends WriteActionArgs {
    spotGridMarketAddress: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    newProtocolFeePerFillBps: number;
    newMinOrderSpacingInTicks: anchor.BN;
    newMinOrderSizeInBaseLots: anchor.BN;
}

export interface UpdateMarketResult extends WriteActionResult {
    spotGridMarketAddress: anchor.web3.PublicKey;
}

export const updateMarket = async({
    provider,
    spotGridMarketAddress,
    owner,
    newProtocolFeePerFillBps,
    newMinOrderSpacingInTicks,
    newMinOrderSizeInBaseLots
}: UpdateMarketArgs): Promise<UpdateMarketResult> => {
    let rootProgram = getRootProgram(provider);
    const transaction = new anchor.web3.Transaction();

    try {
        const ix = await rootProgram
            .methods
            .updateMarket(newProtocolFeePerFillBps, newMinOrderSpacingInTicks, newMinOrderSizeInBaseLots)
            .accounts({
                owner,
                market: spotGridMarketAddress,
            })
            .instruction();

        transaction.add(ix);
        
        return {
            spotGridMarketAddress,
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