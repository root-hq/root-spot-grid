import * as anchor from "@coral-xyz/anchor";
import * as rootSdk from "../../sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

require("dotenv").config();

export const handler = async() => {
    //@ts-ignore
    let privateKeyArray = JSON.parse(process.env.PRIVATE_KEY);

    let traderKeypair = anchor.web3.Keypair.fromSecretKey(
        Uint8Array.from(privateKeyArray)
      );
    
    console.log("traderKey: ", traderKeypair.publicKey.toString());

    const wallet = new NodeWallet(traderKeypair);

    const connection = rootSdk.getConnection('mainnet');

    const provider = new anchor.AnchorProvider(connection, wallet, {});

    const SPOT_GRID_MARKET_ADDRESS = new anchor.web3.PublicKey("");

    let newWithdrawalFeeInBpsHundredths = new anchor.BN(0);
    let newMinOrderSizeInBaseLots = new anchor.BN(100);
    let newMinOrderSpacingInTicks = new anchor.BN(100);

    const tx = await rootSdk.updateMarket({
        provider,
        spotGridMarketAddress: SPOT_GRID_MARKET_ADDRESS,
        owner: provider.wallet.publicKey,
        newWithdrawalFeeInBpsHundredths,
        newMinOrderSizeInBaseLots,
        newMinOrderSpacingInTicks
    })

    const result = await rootSdk.executeTransactions({
        provider,
        transactionInfos: tx.transactionInfos
    });

    console.log("Spot grid market: ", tx.spotGridMarketAddress);
    console.log(`New protocol fee: ${newWithdrawalFeeInBpsHundredths} bps`);
    console.log(`New min order size in base lots: ${newMinOrderSizeInBaseLots}`);
    console.log(`New min order spacing in ticks: ${newMinOrderSpacingInTicks}`);
    
    console.log("Signature: ", result.signatures);
}

handler();