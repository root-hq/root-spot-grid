import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RootSpotGrid } from "../target/types/root_spot_grid";

describe("root-spot-grid", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RootSpotGrid as Program<RootSpotGrid>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
