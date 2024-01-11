import * as anchor from "@coral-xyz/anchor";
import * as rootSdk from "../../sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getAssociatedTokenAddress } from "@solana/spl-token";

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

    const SPOT_GRID_MARKET_ADDRESS = new anchor.web3.PublicKey("AhLBwmRHw4WJyuGbjSx63Bt28zZtrdHKUArYBQAJBA7q");
    const POSITION_ADDRESS = new anchor.web3.PublicKey("7TEmmVyi3YWgX8Rv2PqSmfzPqoynwnBdDaSZBi8j8eeo");

    let baseTokenUserAc = await getAssociatedTokenAddress(rootSdk.WRAPPED_SOL_MAINNET, provider.wallet.publicKey);
    let quoteTokenUserAc = await getAssociatedTokenAddress(rootSdk.USDC_MAINNET, provider.wallet.publicKey);

    let baseBalance = (await connection.getTokenAccountBalance(baseTokenUserAc)).value.uiAmount;
    let quoteBalance = (await connection.getTokenAccountBalance(quoteTokenUserAc)).value.uiAmount;

    let tx = await rootSdk.cancelOrdersAndClosePosition({
      provider,
      spotGridMarketAddress: SPOT_GRID_MARKET_ADDRESS,
      positionAddress: POSITION_ADDRESS,
      baseTokenUserAc,
      quoteTokenUserAc,
    });

    let result = await rootSdk.executeTransactions({
      provider,
      transactionInfos: tx.transactionInfos
    });

    console.log("Position closed: ", POSITION_ADDRESS);
    console.log("Expected withdrawal base: ", baseBalance);
    console.log("Expected withdrawal quote: ", quoteBalance);
    
    console.log("Signature: ", result.signatures);
}

handler();