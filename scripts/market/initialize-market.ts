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

    const tx = await rootSdk.initializeMarket({
        provider,
        phoenixMarket: rootSdk.PHOENIX_SOL_USDC_MAINNET,
        owner: provider.wallet.publicKey,
        protocolFeeRecipient: provider.wallet.publicKey,
        baseTokenMint: rootSdk.WRAPPED_SOL_MAINNET,
        quoteTokenMint: rootSdk.USDC_MAINNET,
        protocolFeePerFillBps: 5,
        minOrderSizeInBaseLots: new anchor.BN(250),
        minOrderSpacingInTicks: new anchor.BN(25)
    });

    const result = await rootSdk.executeTransactions({
        provider,
        transactionInfos: tx.transactionInfos
    });

    console.log("Spot grid market: ", tx.spotGridMarketAddress);
    console.log("Signature: ", result.signatures);
}

handler();