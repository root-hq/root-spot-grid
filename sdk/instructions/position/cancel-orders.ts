import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getBaseTokenVaultAddress, getPositionAddress, getQuoteTokenVaultAddress, getRootProgram, getTradeManagerAddress, requestComputeUnits } from "../../utils";
import { Market, Position } from "../../types";
import * as Phoenix from "@ellipsis-labs/phoenix-sdk";

export interface CancelOrdersArgs extends WriteActionArgs {
    botMarketAddress: anchor.web3.PublicKey;
    positionAddress: anchor.web3.PublicKey;
}

export interface CancelOrdersResult extends WriteActionResult {
    positionAddress: anchor.web3.PublicKey;
}

export const cancelOrders = async({
    provider,
    botMarketAddress,
    positionAddress
}: CancelOrdersArgs): Promise<CancelOrdersResult> => {
    let rootProgram = getRootProgram(provider);

    const market = await rootProgram.account.market.fetch(botMarketAddress) as Market;
    const position = await rootProgram.account.position.fetch(positionAddress) as Position;

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

    // const additionalUnitsIx = requestComputeUnits(1_400_000, 1);
    // transaction.add(...additionalUnitsIx);

    try {
        const ix = await rootProgram
            .methods
            .cancelOrders()
            .accounts({
                owner: provider.wallet.publicKey,
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