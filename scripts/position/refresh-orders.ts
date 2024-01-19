import * as anchor from "@coral-xyz/anchor";
import * as rootSdk from "../../sdk";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

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

    const POSITION_ADDRESS = new anchor.web3.PublicKey("4vWfMWrxxoxiVceDWCZfXeQr1AbUHc3NVf7HGZjUSsxs");

    let counter = 25;

    while(counter > 0) {
      try {
        let tx = await rootSdk.refreshOrders({
          provider,
          positionAddress: POSITION_ADDRESS
        });
    
        let result = await rootSdk.executeTransactions({
          provider,
          transactionInfos: tx.transactionInfos
        });
        await result.confirm();
    
        console.log("Position refreshed: ", tx.positionAddress);
        
        console.log("Signature: ", result.signatures);
        return true;
      }
      catch(err) {
        console.log("Error refreshing: ", err);
      }
      counter--;
    }
}

handler();