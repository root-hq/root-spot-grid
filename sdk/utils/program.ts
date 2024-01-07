import * as anchor from "@coral-xyz/anchor";
import * as idl from "../store/idl/root_spot_grid.json";
import { ROOT_SPOT_GRID_PROGRAM_ID } from "../constants/addresses";
import { RootSpotGrid } from "../store/types/root_spot_grid";
import { getConnection } from "./solana";

export const getRootProgram = (provider: anchor.AnchorProvider) => {
  return new anchor.Program(
    // @ts-ignore
    idl,
    ROOT_SPOT_GRID_PROGRAM_ID,
    provider
  ) as anchor.Program<RootSpotGrid>;
};

export const getRootProgramWithoutProvider = (network: string) => {
  const conn = new anchor.web3.Connection(network);

  const program = new anchor.Program(
    idl as anchor.Idl,
    ROOT_SPOT_GRID_PROGRAM_ID,
    {
      connection: conn,
    }
  );

  return program;
};
