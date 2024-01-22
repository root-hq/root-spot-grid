import * as anchor from "@coral-xyz/anchor";
import * as rootSdk from "../../sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import axios from "axios";
import { Client } from "@ellipsis-labs/phoenix-sdk";

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

    const PHOENIX_MARKET_KEY = new anchor.web3.PublicKey("3J9LfemPBLowAJgpG3YdYPB9n6pUk7HEjwgS6Y5ToSFg");
    const PROTOCOL_FEE_RECIPIENT = new anchor.web3.PublicKey("6HyM2raEk78s8PdiRKqSF36YtSZf3CjwmReTCtdaucuf");

    const BASE_TOKEN_MINT = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112");
    const QUOTE_TOKEN_MINT = new anchor.web3.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

    const withdrawalFeeInBpsHundredths = new anchor.BN(5000);
    const minOrderSizeInBaseLots = new anchor.BN(100);
    const minOrderSpacingInTicks = new anchor.BN(10);

    const phoenixClient = await Client.create(connection);
    await phoenixClient.addMarket(PHOENIX_MARKET_KEY.toString());
    
    const tx = await rootSdk.initializeMarket({
        provider,
        phoenixMarket: PHOENIX_MARKET_KEY,
        owner: provider.wallet.publicKey,
        protocolFeeRecipient: PROTOCOL_FEE_RECIPIENT,
        baseTokenMint: BASE_TOKEN_MINT,
        quoteTokenMint: QUOTE_TOKEN_MINT,
        withdrawalFeeInBpsHundredths,
        minOrderSizeInBaseLots,
        minOrderSpacingInTicks
    });

    const result = await rootSdk.executeTransactions({
        provider,
        transactionInfos: tx.transactionInfos
    });

    console.log("Spot grid market: ", tx.spotGridMarketAddress);
    console.log("Phoenix market: ", PHOENIX_MARKET_KEY);
    console.log("Spot grid market key: ", tx.spotGridMarketKey);
    console.log("Owner: ", provider.wallet.publicKey);
    console.log("Base token mint: ", BASE_TOKEN_MINT);
    console.log("Quote token mint: ", QUOTE_TOKEN_MINT);
    console.log("Withdrawal fee per fill bps hundredths: ", withdrawalFeeInBpsHundredths.toString());
    console.log("Min order size in base lots: ", minOrderSizeInBaseLots.toString());
    console.log("Min order spacing in ticks: ", minOrderSpacingInTicks.toString());
    
    console.log("Signature: ", result.signatures);

    const URL = `https://spot-grid-db-utils.vercel.app/api/`;
        const data = {
            "spot_grid_market_address": tx.spotGridMarketAddress,
            "phoenix_market_address": PHOENIX_MARKET_KEY,
            "spot_grid_market_key": tx.spotGridMarketKey,
            "owner": provider.wallet.publicKey,
            "base_token_mint": BASE_TOKEN_MINT,
            "quote_token_mint": QUOTE_TOKEN_MINT,
            "withdrawal_fee_in_bps_hundredths": withdrawalFeeInBpsHundredths.toString(),
            "min_order_spacing_in_ticks": minOrderSizeInBaseLots.toString(),
            "min_order_size_in_base_lots": minOrderSpacingInTicks.toString(),
        }
    
        const allMarkets = await axios.post(URL + `market/add-market`, data);
        console.log("Response: ", allMarkets);
        return true;
}

handler();