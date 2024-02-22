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
  });
});
