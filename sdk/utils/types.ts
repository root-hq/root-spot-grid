import * as anchor from "@coral-xyz/anchor";

export interface WriteActionArgs {
  /** Anchor provider */
  provider: anchor.AnchorProvider;
}

export interface ReadActionArgs {
  /** Solana web3 connection */
  connection: anchor.web3.Connection;
}

export interface TransactionInfo {
  transaction: anchor.web3.Transaction;
  signers?: anchor.web3.Signer[];
}

export interface VersionedTransactionInfo {
  transaction: anchor.web3.VersionedTransaction;
  signers?: anchor.web3.Signer[];
}

export interface WriteActionResult {
  /** Array of objects containing transaction and signers */
  transactionInfos: TransactionInfo[];
}

export interface WriteActionResultV0 {
  transactionInfos: VersionedTransactionInfo[];
}
