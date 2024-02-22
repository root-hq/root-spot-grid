import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getRootProgram } from "../../utils";

export interface UpdateMarketArgs extends WriteActionArgs {
    botMarketAddress: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    newWithdrawalFeeInBpsHundredths: anchor.BN;
    newMinOrderSpacingInTicks: anchor.BN;
    newMinOrderSizeInBaseLots: anchor.BN;
}

export interface UpdateMarketResult extends WriteActionResult {
    botMarketAddress: anchor.web3.PublicKey;
}

export const updateMarket = async({
    provider,
    botMarketAddress,
    owner,
    newWithdrawalFeeInBpsHundredths,
    newMinOrderSpacingInTicks,
    newMinOrderSizeInBaseLots
}: UpdateMarketArgs): Promise<UpdateMarketResult> => {
    let rootProgram = getRootProgram(provider);
    const transaction = new anchor.web3.Transaction();

    try {
        const ix = await rootProgram
            .methods
            .updateMarket(newWithdrawalFeeInBpsHundredths, newMinOrderSpacingInTicks, newMinOrderSizeInBaseLots)
            .accounts({
                owner,
                market: botMarketAddress,
            })
            .instruction();

        transaction.add(ix);
        
        return {
            botMarketAddress,
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