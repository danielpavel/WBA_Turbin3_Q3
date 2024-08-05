import {
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { AnchorProvider, Wallet, Program } from "@coral-xyz/anchor";

import { WbaPrereq } from "./programs/wba_prereqs";
import IDL from "./programs/wba_prereqs.json";

const GITHUB_PROFILE = "danielpavel";
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Enable this flag to serialize the transaction and print it
const DEBUG = true;

(async () => {
  try {
    const wallet = await getKeypairFromFile("wba_wallet.json");
    const github = Buffer.from(GITHUB_PROFILE, "utf8");
    const provider = new AnchorProvider(connection, new Wallet(wallet), {
      commitment: "confirmed",
    });
    const blockhash = await connection.getRecentBlockhash("confirmed");

    // Create our program
    const program: Program<WbaPrereq> = new Program(IDL as WbaPrereq, provider);

    // Create the PDA for our enrollment account
    const enrollment_seeds = [
      Buffer.from("prereq"),
      wallet.publicKey.toBuffer(),
    ];

    const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(
      enrollment_seeds,
      program.programId,
    );

    const accounts = {
      signer: wallet.publicKey,
      prereq: enrollment_key,
      systemProgram: PublicKey.default,
    };

    let txSig;
    if (DEBUG) {
      const ix = await program.methods
        .complete(github)
        .accounts(accounts)
        .signers([wallet])
        .instruction();

      const anchorWallet = new Wallet(wallet);

      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash.blockhash,
        instructions: [ix],
      }).compileToLegacyMessage();

      const versionedTx = new VersionedTransaction(messageV0);
      const signedTx = await anchorWallet.signTransaction(versionedTx);
      console.log(
        "[serialized Tx]",
        Buffer.from(signedTx.serialize()).toString("base64"),
      );

      txSig = await connection.sendTransaction(signedTx);
    } else {
      txSig = await program.methods
        .complete(github)
        .accounts(accounts)
        .signers([wallet])
        .rpc();
    }

    const link = getExplorerLink("tx", txSig, "devnet");
    console.log(`✅ Enrollment transaction confirmed. ${link}`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
