import * as anchor from "@coral-xyz/anchor";
import {
  BASE_TOKEN_VAULT_SEED,
  MARKET_SEED,
  POSITION_SEED,
  QUOTE_TOKEN_VAULT_SEED,
  ROOT_TRADING_BOTS_PROGRAM_ID,
  TRADE_MANAGER_SEED,
} from "../constants";

export const getBotMarketAddress = (
  phoenixMarket: anchor.web3.PublicKey,
  botMarketKey: anchor.web3.PublicKey
): anchor.web3.PublicKey => {
  let [botMarketAddress,] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      MARKET_SEED,
      phoenixMarket.toBuffer(),
      botMarketKey.toBuffer()
    ],
    ROOT_TRADING_BOTS_PROGRAM_ID
  );

  return botMarketAddress;
};

export const getTradeManagerAddress = (
  positionAddress: anchor.web3.PublicKey
): anchor.web3.PublicKey => {
  let [tradeManagerAddr] = anchor.web3.PublicKey.findProgramAddressSync(
    [TRADE_MANAGER_SEED, positionAddress.toBuffer()],
    ROOT_TRADING_BOTS_PROGRAM_ID
  );

  return tradeManagerAddr;
};

export const getBaseTokenVaultAddress = (
  positionAddress: anchor.web3.PublicKey
): anchor.web3.PublicKey => {
  let [baseTokenVaultAddr] = anchor.web3.PublicKey.findProgramAddressSync(
    [BASE_TOKEN_VAULT_SEED, positionAddress.toBuffer()],
    ROOT_TRADING_BOTS_PROGRAM_ID
  );

  return baseTokenVaultAddr;
};

export const getQuoteTokenVaultAddress = (
  positionAddress: anchor.web3.PublicKey
): anchor.web3.PublicKey => {
  let [quoteTokenVaultAddr] = anchor.web3.PublicKey.findProgramAddressSync(
    [QUOTE_TOKEN_VAULT_SEED, positionAddress.toBuffer()],
    ROOT_TRADING_BOTS_PROGRAM_ID
  );

  return quoteTokenVaultAddr;
};

export const getPositionAddress = (
  positionKey: anchor.web3.PublicKey
): anchor.web3.PublicKey => {
  let [positionAddress] = anchor.web3.PublicKey.findProgramAddressSync(
    [POSITION_SEED, positionKey.toBuffer()],
    ROOT_TRADING_BOTS_PROGRAM_ID
  );

  return positionAddress;
}