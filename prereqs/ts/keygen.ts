import { Keypair } from "@solana/web3.js";
import { writeToFile } from "./utils";

// Output filename for the newly created wallet
const WALLET_FNAME = "dev-wallet.json";

let kp = Keypair.generate();

console.log(
  `You've generated a new Solana wallet: Publickey: ${kp.publicKey.toBase58()}, secretKey: ${
    kp.secretKey
  }`,
);

console.log(`Writing wallet to ${WALLET_FNAME}`);
const secretKey = `[${kp.secretKey}]`;

writeToFile(WALLET_FNAME, secretKey);
