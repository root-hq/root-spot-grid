import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RootSpotGrid } from "../target/types/root_spot_grid";

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

    let createSig = await program
      .methods
      .initializeMarket(5, new anchor.BN(25), new anchor.BN(500))
      .accounts({
        owner: provider.wallet.publicKey,
        phoenixMarket: SOL_USDC_MARKET,
        protocolFeeRecipient: provider.wallet.publicKey,
        market: spotGridMarketAddress,
        baseTokenMint: SOL_MAINNET,
        quoteTokenMint: USDC_MAINNET
      })
      .rpc();

    console.log("Create signature: ", createSig);
  });
});
