import {
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const wba = new PublicKey("9j3uYxDQdgZxncwHrtroGPwo9qw9RhbBJpnhcbkNsafT");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

(async () => {
  const keypair = await getKeypairFromFile("dev-wallet.json");

  try {
    const balance = await connection.getBalance(keypair.publicKey);
    console.log("Keypair balance", balance);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: wba,
        lamports: balance,
      }),
    );

    tx.recentBlockhash = (
      await connection.getRecentBlockhash("confirmed")
    ).blockhash;
    tx.feePayer = keypair.publicKey;

    const txMessage = tx.compileMessage();
    const fee =
      (await connection.getFeeForMessage(txMessage, "confirmed")).value || 0;
    console.log("Transaction fee:", fee);

    tx.instructions.pop();

    tx.add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: wba,
        lamports: balance - fee,
      }),
    );

    const txSig = await sendAndConfirmTransaction(connection, tx, [keypair]);

    const link = getExplorerLink("tx", txSig, "devnet");
    console.log(
      `✅ Sending ${
        (balance - fee) / LAMPORTS_PER_SOL
      } transaction confirmed. ${link}`,
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
