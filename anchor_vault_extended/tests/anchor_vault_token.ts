import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVaultToken } from "../target/types/anchor_vault_token";

import { Keypair, PublicKey } from "@solana/web3.js";
import { createAndMint, generateRandomHex } from "./utils";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("anchor_vault_token", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();
  const connection = provider.connection;

  const program = anchor.workspace
    .AnchorVaultToken as Program<AnchorVaultToken>;

  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  const { mint: mintA, ata: user1_Ata } = await createAndMint(
    provider,
    100,
    user1.publicKey
  );
  const { mint: mintB, ata: user2_Ata } = await createAndMint(
    provider,
    100,
    user2.publicKey
  );

  it("maker", async () => {
    try {
      const seed = generateRandomHex();
      const [escrow] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("escrow")),
          user1.publicKey.toBuffer(),
          Buffer.from(anchor.utils.bytes.utf8.encode(seed)),
        ],
        program.programId
      );
      let vault = getAssociatedTokenAddressSync(mintA.publicKey, escrow);

      const accounts = {
        maker: provider.publicKey,
        mintA: mintA.publicKey,
        mintB: mintB.publicKey,

        makerAtaA: user1_Ata,
        escrow,
        vault,
      };

      const params = {};

      const tx = await program.methods
        .make(new anchor.BN(seed), new anchor.BN(10), new anchor.BN(5))
        .accounts(accounts)
        .rpc();

      console.log("Your transaction signature", tx);
    } catch (err) {
      console.error(err);
    }
  });
});
