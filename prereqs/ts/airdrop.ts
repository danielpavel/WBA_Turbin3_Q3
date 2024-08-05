import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";

const WALLET_FILENAME = "dev-wallet.json";

(async () => {
  const keypair = await getKeypairFromFile(WALLET_FILENAME);
  console.log(`Using wallet ${keypair.publicKey.toBase58()} to airdrop`);

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );

  try {
    const txHash = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    const link = getExplorerLink("tx", txHash, "devnet");
    console.log(`Airdrop confirmed. ${link}`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
