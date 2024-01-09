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

    let baseTokenUserAc = await getAssociatedTokenAddress(rootSdk.WRAPPED_SOL_MAINNET, provider.wallet.publicKey);
    let quoteTokenUserAc = await getAssociatedTokenAddress(rootSdk.USDC_MAINNET, provider.wallet.publicKey);

    let args = {
      mode: {
        arithmetic: {}
      },
      numGrids: new anchor.BN(5),
      minPriceInTicks: new anchor.BN(95000),
      maxPriceInTicks: new anchor.BN(105000),
      orderSizeInBaseLots: new anchor.BN(250),
    } as rootSdk.PositionArgs;

    let tx = await rootSdk.createPosition({
      provider,
      spotGridMarketAddress: SPOT_GRID_MARKET_ADDRESS,
      baseTokenUserAc,
      quoteTokenUserAc,
      positionArgs: args
    });

    let result = await rootSdk.executeTransactions({
      provider,
      transactionInfos: tx.transactionInfos
    });

    console.log("New spot grid position: ", tx.positionAddress);
    console.log("Parameters");
    console.log(`Mode: ${args.mode}`);
    console.log(`Number of grids: ${args.numGrids.toString()}`);
    console.log(`Minimum price in ticks: ${args.minPriceInTicks}`);
    console.log(`Maximum price in ticks: ${args.maxPriceInTicks}`);
    console.log(`Order size in base lots: ${args.orderSizeInBaseLots}`);
    
    console.log("Signature: ", result.signatures);
}

handler();