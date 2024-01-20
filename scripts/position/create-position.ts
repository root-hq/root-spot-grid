import * as anchor from "@coral-xyz/anchor";
import * as rootSdk from "../../sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import axios from "axios";

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

    const SPOT_GRID_MARKET_ADDRESS = new anchor.web3.PublicKey("4wAokmksMM4WAsT14KVUiVX9esyxt3NV7gCcngGiFWWk");

    let baseTokenUserAc = await getAssociatedTokenAddress(rootSdk.WRAPPED_SOL_MAINNET, provider.wallet.publicKey);
    let quoteTokenUserAc = await getAssociatedTokenAddress(rootSdk.USDC_MAINNET, provider.wallet.publicKey);

    let NUM_GRIDS = new anchor.BN(25);
    let MIN_PRICE_IN_TICKS = new anchor.BN(100000);
    let MAX_PRICE_IN_TICKS = new anchor.BN(130000);
    let ORDER_SIZE_IN_BASE_LOTS = new anchor.BN(100);

    let args = {
      mode: {
        arithmetic: {}
      },
      numGrids: NUM_GRIDS,
      minPriceInTicks: MIN_PRICE_IN_TICKS,
      maxPriceInTicks: MAX_PRICE_IN_TICKS,
      orderSizeInBaseLots: ORDER_SIZE_IN_BASE_LOTS,
    } as rootSdk.PositionArgs;

    let counter = 25;

    while(counter > 0) {
      try {
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
        await result.confirm();

        console.log("New spot grid position");
        console.log("Owner: ", provider.wallet.publicKey);
        console.log("Position address: ", tx.positionAddress);
        console.log("Position key: ", tx.positionKey);
        console.log("Spot Grid market address: ", SPOT_GRID_MARKET_ADDRESS);
        console.log("Trade manager address: ", tx.tradeManagerAddress);
        console.log("Seat: ", tx.seat);
        
        console.log("Parameters");
        console.log(`Mode: ${args.mode}`);
        console.log(`Number of grids: ${args.numGrids.toNumber()}`);
        console.log(`Minimum price in ticks: ${args.minPriceInTicks.toString()}`);
        console.log(`Maximum price in ticks: ${args.maxPriceInTicks.toString()}`);
        console.log(`Order size in base lots: ${args.orderSizeInBaseLots.toString()}`);
    
        console.log("Signature: https://solscan.io/tx/", result.signatures[0]);
    
    
        const URL = `https://spot-grid-db-utils.vercel.app/api/`;
        const data = {
          "owner": provider.wallet.publicKey,
          "position_address": tx.positionAddress,
          "position_key": tx.positionKey,
          "spot_grid_market_address": SPOT_GRID_MARKET_ADDRESS,
          "trade_manager_address": tx.tradeManagerAddress,
          "seat": tx.seat,
          "mode": "Arithmetic",
          "num_grids": NUM_GRIDS,
          "min_price_in_ticks": MIN_PRICE_IN_TICKS,
          "max_price_in_ticks": MAX_PRICE_IN_TICKS,
          "order_size_in_base_lots": ORDER_SIZE_IN_BASE_LOTS,
        }
    
        const allMarkets = await axios.post(URL + `position/add-position`, data);
        console.log("Response: ", allMarkets);
        return true;
      }
      catch(err) {
        console.log("Error creating market: ", err);
      }
      counter--;
    }

}

handler();