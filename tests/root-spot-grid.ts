import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RootSpotGrid } from "../target/types/root_spot_grid";
import { PositionArgs, createPosition, executeTransactions, getPositionAddress, getTradeManagerAddress, initializeMarket, initializeMints } from "../sdk";
import { getAssociatedTokenAddress } from "@solana/spl-token";

describe("root-spot-grid", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RootSpotGrid as Program<RootSpotGrid>;
  const PROGRAM_ID = new anchor.web3.PublicKey("13uxuLoQHvpp1K1571WcgoTYEV4Ys5ni7LqjBZiTmNNx");
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  it("Is initialized!", async () => {
    // Add your test here.
    let SOL_USDC_MARKET = new anchor.web3.PublicKey("4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg");
    let SOL_MAINNET = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112");
    let USDC_MAINNET = new anchor.web3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    let [spotGridMarketAddress,] = anchor.web3.PublicKey.findProgramAddressSync([
        Buffer.from("market"),
        SOL_USDC_MARKET.toBuffer()
      ],
      PROGRAM_ID
    );

    const mintInfos = await initializeMints(provider, 2, [9, 6],[provider.wallet.publicKey], [
      new anchor.BN(100), new anchor.BN(100)
    ])

    let feeCollectorKeypair = anchor.web3.Keypair.generate();
    console.log("Fee collector: ", feeCollectorKeypair.publicKey.toString());

    let tx = await initializeMarket({
      provider,
      owner: provider.wallet.publicKey,
      protocolFeeRecipient: feeCollectorKeypair.publicKey,
      baseTokenMint: mintInfos.tokens[0],
      quoteTokenMint: mintInfos.tokens[1],
      phoenixMarket: SOL_USDC_MARKET,
      withdrawalFeeInBpsHundredths: new anchor.BN(500),
      minOrderSizeInBaseLots: new anchor.BN(100),
      minOrderSpacingInTicks: new anchor.BN(20)
    });

    let res = await executeTransactions({
      provider,
      transactionInfos: tx.transactionInfos
    });

    console.log("Create market sig: ", res.signatures);

    // const positionKey = anchor.web3.Keypair.generate();
    // const positionAddr = getPositionAddress(positionKey.publicKey);
    // const tradeManagerAddress = getTradeManagerAddress(spotGridMarketAddress);

    // let baseTokenMint = mintInfos.tokens[0];
    // let quoteTokenMint = mintInfos.tokens[1];

    // let baseTokenUserAc = await getAssociatedTokenAddress(baseTokenMint, provider.wallet.publicKey);
    // let quoteTokenUserAc = await getAssociatedTokenAddress(quoteTokenMint, provider.wallet.publicKey);

    // let args = {
    //   mode: {
    //     arithmetic: {}
    //   },
    //   numGrids: new anchor.BN(5),
    //   minPriceInTicks: new anchor.BN(95000),
    //   maxPriceInTicks: new anchor.BN(105000),
    //   orderSizeInBaseLots: new anchor.BN(1000),
    // } as PositionArgs;

    // let createPos = await createPosition({
    //   provider,
    //   spotGridMarketAddress,
    //   baseTokenUserAc,
    //   quoteTokenUserAc,
    //   positionArgs: args
    // });

    // let res = await executeTransactions({
    //   provider,
    //   transactionInfos: createPos.transactionInfos
    // });

    // console.log("Create signature: ", res.signatures);
  });
});
