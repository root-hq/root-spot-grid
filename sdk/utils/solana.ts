import * as anchor from "@coral-xyz/anchor";
import {
  SOLANA_DEVNET_RPC,
  SOLANA_LOCALNET_RPC,
  SOLANA_MAINNET_RPC,
} from "../constants";
import { TransactionInfo } from "./types";

export const requestComputeUnits = (
  unitsRequested: number,
  additionalFee: number
) => {
  const additionalComputeBudgetInstruction =
    anchor.web3.ComputeBudgetProgram.requestUnits({
      units: unitsRequested,
      additionalFee: additionalFee,
    });

  return additionalComputeBudgetInstruction;
};

export const getConnection = (network) => {
  let connection: anchor.web3.Connection;
  if (network === "mainnet") {
    connection = new anchor.web3.Connection(SOLANA_MAINNET_RPC, "processed");
  } else if (network === "devnet") {
    connection = new anchor.web3.Connection(SOLANA_DEVNET_RPC, "processed");
  } else {
    connection = new anchor.web3.Connection(SOLANA_LOCALNET_RPC, "processed");
  }

  return connection;
};

export const createKeypair = async (provider: anchor.Provider) => {
  const keypair = new anchor.web3.Keypair();
  const txn = await provider.connection.requestAirdrop(
    keypair.publicKey,
    10 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(txn);
  return keypair;
};

export interface ExecuteTransactionsArgs {
  /** Anchor provider */
  provider: anchor.AnchorProvider;
  /** Array of transaction and signers */
  transactionInfos: TransactionInfo[];
  /** Whether to send the txs in parallel */
  parallel?: boolean;
}

export interface ExecuteTransactionsResult {
  /** Signatures of the sent transactions */
  signatures: anchor.web3.TransactionSignature[];
  /** The most recent blockhash observed by the client */
  blockhash: string;
  /** Block height till which the transactions will stay valid */
  lastValidBlockHeight: number;
  /** Async function to confirm the transactions */
  confirm: (commitment?: anchor.web3.Commitment) => Promise<void>;
}

export const executeTransactions = async ({
  provider,
  transactionInfos,
  parallel = true,
}: ExecuteTransactionsArgs): Promise<ExecuteTransactionsResult> => {
  const { blockhash, lastValidBlockHeight } =
    await provider.connection.getLatestBlockhash("finalized");

  // Sign txs with given signer
  const partiallySignedTxs = transactionInfos.map(
    ({ transaction, signers = [] }) => {
      // Set correct tx parameters
      transaction.feePayer = provider.wallet.publicKey;
      transaction.recentBlockhash = blockhash;

      // Sign with signers
      signers.forEach((signer) => {
        transaction.partialSign(signer);
      });

      return transaction;
    }
  );

  // Sign with provider wallet
  const signedTxs = await provider.wallet.signAllTransactions(
    partiallySignedTxs
  );

  // Send all transactions and get signatures
  let signatures: anchor.web3.TransactionSignature[] = [];
  if (parallel) {
    signatures = await Promise.all(
      signedTxs.map(
        async (tx) =>
          await provider.connection.sendRawTransaction(tx.serialize(), {
            preflightCommitment: "processed",
          })
      )
    );
  } else {
    for (const tx of signedTxs) {
      // Send transaction and wait for it to be processed
      const signature = await provider.connection.sendRawTransaction(
        tx.serialize(),
        {
          preflightCommitment: "processed",
        }
      );
      await confirmTransaction({
        connection: provider.connection,
        signature,
        blockhash,
        lastValidBlockHeight,
        commitment: "processed",
      });
      signatures.push(signature);
    }
  }

  // Create the confirmation function
  const confirm = async (commitment: anchor.web3.Commitment = "confirmed") => {
    await Promise.all(
      signatures.map(async (signature) => {
        await confirmTransaction({
          signature,
          connection: provider.connection,
          blockhash,
          lastValidBlockHeight,
          commitment,
        });
      })
    );
  };

  return {
    signatures,
    confirm,
    blockhash,
    lastValidBlockHeight,
  };
};

export interface ConfirmTransactionArgs {
  /** Solana web3 connection */
  connection: anchor.web3.Connection;
  /** Transaction signature */
  signature: anchor.web3.TransactionSignature;
  /** The blockhash mentioned in the transaction */
  blockhash: string;
  /** Block height till which the transaction will stay valid */
  lastValidBlockHeight: number;
  /** The commitment for confirming transaction */
  commitment?: anchor.web3.Commitment;
}

/**
 * Confirm a transaction
 * @param args Argument object
 */
export const confirmTransaction = async ({
  connection,
  signature,
  blockhash,
  lastValidBlockHeight,
  commitment = "confirmed",
}: ConfirmTransactionArgs) => {
  try {
    const { value } = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      commitment
    );
    if (value.err)
      throw new ConfirmationError(
        `Transaction ${signature} failed to confirm. ${JSON.stringify(
          value.err
        )}`
      );
  } catch (error) {
    // The whole part below is just to get better error logs
    if (error instanceof ConfirmationError) {
      const failedTx = await connection.getTransaction(signature, {
        commitment: "confirmed",
      });
      const logs = failedTx?.meta?.logMessages;
      throw logs
        ? new anchor.web3.SendTransactionError(error.message, logs)
        : error;
    } else {
      throw error;
    }
  }
};

class ConfirmationError extends Error {}
