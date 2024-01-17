import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getBaseTokenVaultAddress, getQuoteTokenVaultAddress, getRootProgram, getTradeManagerAddress, requestComputeUnits } from "../../utils";
import { Market, Position } from "../../types";
import * as Phoenix from "@ellipsis-labs/phoenix-sdk";
import { PHOENIX_SEAT_MANAGER_PROGRAM_ID } from "../../constants";

export interface RefreshOrdersArgs extends WriteActionArgs {
    positionAddress: anchor.web3.PublicKey;
}

export interface RefreshOrdersResult extends WriteActionResult {
    positionAddress: anchor.web3.PublicKey;
}

export const refreshOrders = async({
    provider,
    positionAddress
}: RefreshOrdersArgs): Promise<RefreshOrdersResult> => {
    let rootProgram = getRootProgram(provider);

    const position = await rootProgram.account.position.fetch(positionAddress) as Position;

    const market = await rootProgram.account.market.fetch(position.market) as Market;

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
    const seat = phoenixMarketState.getSeatAddress(tradeManager);
    const basePhoenixVault = phoenixMarketState.data.header.baseParams.vaultKey;
    const quotePhoenixVault = phoenixMarketState.data.header.quoteParams.vaultKey;

    const seatManager = Phoenix.getSeatManagerAddress(phoenixMarket);
    const seatDepositCollector =
        Phoenix.getSeatDepositCollectorAddress(phoenixMarket);

    
    const transaction = new anchor.web3.Transaction();

    const additionalUnitsIx = requestComputeUnits(1_400_000, 1000);
    transaction.add(...additionalUnitsIx);

    try {
        const ix = await rootProgram
            .methods
            .refreshOrders()
            .accounts({
                cranker: provider.wallet.publicKey,
                phoenixMarket,
                spotGridMarket: position.market,
                positionKey: position.positionKey,
                tradeManager,
                logAuthority,
                seat,
                seatManager,
                seatDepositCollector,
                baseTokenMint,
                quoteTokenMint,
                position: positionAddress,
                baseTokenVaultAc,
                quoteTokenVaultAc,
                basePhoenixVault,
                quotePhoenixVault,
                phoenixProgram: Phoenix.PROGRAM_ADDRESS,
                phoenixSeatManagerProgram: PHOENIX_SEAT_MANAGER_PROGRAM_ID
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