import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getRootProgram, getSpotGridMarketAddress } from "../../utils";
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
    withdrawalFeeInBpsHundredths,
    minOrderSpacingInTicks,
    minOrderSizeInBaseLots
}: InitializeMarketArgs): Promise<InitializeMarketResult> => {
    let rootProgram = getRootProgram(provider);

    let spotGridMarketKeypair = anchor.web3.Keypair.generate();

    let spotGridMarketAddress = getSpotGridMarketAddress(phoenixMarket, spotGridMarketKeypair.publicKey);

    let baseTokenFeeAc = await getAssociatedTokenAddress(baseTokenMint, protocolFeeRecipient, false);
    let quoteTokenFeeAc = await getAssociatedTokenAddress(quoteTokenMint, protocolFeeRecipient, false);

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
    transaction.add(baseTokenAccountInitIx);
    transaction.add(quoteTokeAccountInitIx);

    try {
        const ix = await rootProgram
            .methods
            .initializeMarket(withdrawalFeeInBpsHundredths, minOrderSpacingInTicks, minOrderSizeInBaseLots)
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