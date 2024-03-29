import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getRootProgram, getBotMarketAddress } from "../../utils";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

export interface InitializeMarketArgs extends WriteActionArgs {
    phoenixMarket: anchor.web3.PublicKey;
    owner: anchor.web3.PublicKey;
    protocolFeeRecipient: anchor.web3.PublicKey;
    baseTokenMint: anchor.web3.PublicKey;
    quoteTokenMint: anchor.web3.PublicKey;
    withdrawalFeeInBpsHundredths: anchor.BN;
    minOrderSpacingInTicks: anchor.BN;
    minOrderSizeInBaseLots: anchor.BN;
}

export interface InitializeMarketResult extends WriteActionResult {
   botMarketAddress: anchor.web3.PublicKey;
    botMarketKey: anchor.web3.PublicKey;
}

export const initializeMarket = async({
    provider,
    phoenixMarket,
    owner,
    protocolFeeRecipient,
    baseTokenMint,
    quoteTokenMint,
    withdrawalFeeInBpsHundredths,
    minOrderSpacingInTicks,
    minOrderSizeInBaseLots
}: InitializeMarketArgs): Promise<InitializeMarketResult> => {
    let rootProgram = getRootProgram(provider);

    let botMarketKeypair = anchor.web3.Keypair.generate();

    let botMarketAddress = getBotMarketAddress(phoenixMarket, botMarketKeypair.publicKey);

    let baseTokenFeeAc = await getAssociatedTokenAddress(baseTokenMint, protocolFeeRecipient, true);
    let quoteTokenFeeAc = await getAssociatedTokenAddress(quoteTokenMint, protocolFeeRecipient, true);

    let baseTokenAccountInitIx = createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        baseTokenFeeAc,
        protocolFeeRecipient,
        baseTokenMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_PROGRAM_ID
    );

    let quoteTokeAccountInitIx = createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        quoteTokenFeeAc,
        protocolFeeRecipient,
        quoteTokenMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_PROGRAM_ID
    );

    const transaction = new anchor.web3.Transaction();
    
    if((await provider.connection.getBalance(baseTokenFeeAc)) === 0) {
        transaction.add(baseTokenAccountInitIx);
    }
    
    if((await provider.connection.getBalance(quoteTokenFeeAc)) === 0) {
        transaction.add(quoteTokeAccountInitIx);
    }

    try {
        const ix = await rootProgram
            .methods
            .initializeMarket(withdrawalFeeInBpsHundredths, minOrderSpacingInTicks, minOrderSizeInBaseLots)
            .accounts({
                owner,
                phoenixMarket,
                botMarketKey: botMarketKeypair.publicKey,
                protocolFeeRecipient,
                market: botMarketAddress,
                baseTokenMint,
                quoteTokenMint
            })
            .instruction();

        transaction.add(ix);
        
        return {
            botMarketAddress,
            botMarketKey: botMarketKeypair.publicKey,
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