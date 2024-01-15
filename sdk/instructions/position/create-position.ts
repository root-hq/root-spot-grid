import * as anchor from "@coral-xyz/anchor";
import { WriteActionArgs, WriteActionResult, getBaseTokenVaultAddress, getPositionAddress, getQuoteTokenVaultAddress, getRootProgram, getTradeManagerAddress, requestComputeUnits } from "../../utils";
import { Market, PositionArgs } from "../../types";
import * as Phoenix from "@ellipsis-labs/phoenix-sdk";
import { PHOENIX_SEAT_MANAGER_PROGRAM_ID } from "../../constants";

export interface CreatePositionArgs extends WriteActionArgs {
    spotGridMarketAddress: anchor.web3.PublicKey;
    baseTokenUserAc: anchor.web3.PublicKey;
    quoteTokenUserAc: anchor.web3.PublicKey;
    positionArgs: PositionArgs
}

export interface CreatePositionResult extends WriteActionResult {
    positionAddress: anchor.web3.PublicKey;
    positionKey: anchor.web3.PublicKey;
    tradeManagerAddress: anchor.web3.PublicKey;
    seat: anchor.web3.PublicKey;
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
    const baseTokenMint = market.baseTokenMint;
    const quoteTokenMint = market.quoteTokenMint;

    const positionAddress = getPositionAddress(positionKey.publicKey);
    
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

    const additionalUnitsIx = requestComputeUnits(1_400_000, 1);
    transaction.add(...additionalUnitsIx);

    try {
        const ix = await rootProgram
            .methods
            .createPosition(positionArgs)
            .accounts({
                creator: provider.wallet.publicKey,
                phoenixMarket,
                spotGridMarket: spotGridMarketAddress,
                positionKey: positionKey.publicKey,
                tradeManager,
                logAuthority,
                seat,
                seatManager,
                seatDepositCollector,
                baseTokenMint,
                quoteTokenMint,
                position: positionAddress,
                baseTokenUserAc,
                quoteTokenUserAc,
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
            positionKey: positionKey.publicKey,
            tradeManagerAddress: tradeManager,
            seat,
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