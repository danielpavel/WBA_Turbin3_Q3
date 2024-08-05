import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../wba-wallet.json";
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  Mint,
  transfer,
} from "@solana/spl-token";
import { getExplorerLink } from "@solana-developers/helpers";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("8KMdYpCQrkutMjhgn7d9AWdoZZWJvnLzs7Z5A7e15nsi");

// Recipient address
const to = new PublicKey("guney82WWYTi5QSaqqcQjy9VqrQAAGqRx63LmPT8G74");

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey,
    );

    console.log("🔍 From ATA Address: ", fromAta.address.toBase58());

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to,
    );

    console.log("🔍 To ATA Address: ", toAta.address.toBase58());

    const mintAccount: Mint = await getMint(connection, mint);

    const sig = await transfer(
      connection,
      keypair,
      fromAta.address,
      toAta.address,
      keypair.publicKey,
      1 * 10 ** mintAccount.decimals,
    );

    const link = getExplorerLink("tx", sig, "devnet");

    console.log(`✅ Transaction Done! - ${link}`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();

