import * as anchor from "@coral-xyz/anchor";
import { getRootProgramWithoutProvider } from "./program";

export const getVaultAccount = async (
  vaultAddress: anchor.web3.PublicKey,
  network: string
) => {
  try {
    const program = getRootProgramWithoutProvider(network);

    const vault = await program.account.unifiedVault.fetch(vaultAddress);

    return vault;
  } catch (err) {
    console.log(`Error fetching vault account ${vaultAddress}, err: ${err}`);
    return null;
  }
};

export const getAllVaultAccounts = async (network: string) => {
  try {
    const wallet = new anchor.Wallet(anchor.web3.Keypair.generate());
    const connection = new anchor.web3.Connection(network);

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );

    const program = getRootProgramWithoutProvider(network);

    const vaults = await program.account.unifiedVault.all();

    return vaults;
  } catch (err) {
    console.log(`Error fetching all vault accounts, err: ${err}`);
    return null;
  }
};

export const getDepositReceiptAccount = async (
  depositReceipt: anchor.web3.PublicKey,
  network: string
) => {
  try {
    const wallet = new anchor.Wallet(anchor.web3.Keypair.generate());
    const connection = new anchor.web3.Connection(network);

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );

    const program = getRootProgramWithoutProvider(network);

    const receipt = await program.account.depositReceipt.fetch(depositReceipt);

    return receipt;
  } catch (err) {
    console.log(
      `Error fetching deposit receipt account ${depositReceipt}, err: ${err}`
    );
    return null;
  }
};

export const getAllDepositReceiptAccount = async (network: string) => {
  try {
    const wallet = new anchor.Wallet(anchor.web3.Keypair.generate());
    const connection = new anchor.web3.Connection(network);

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );

    const program = getRootProgramWithoutProvider(network);

    const receipts = await program.account.depositReceipt.all();

    return receipts;
  } catch (err) {
    console.log(`Error fetching deposit receipt accounts, err: ${err}`);
    return null;
  }
};
