import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVaultToken } from "../target/types/anchor_vault_token";

import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createAndMint, generateRandomU64Seed } from "./utils";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";

const DECIMALS = 6;

describe("anchor_vault_token", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();
  const connection = provider.connection;

  const program = anchor.workspace
    .AnchorVaultToken as Program<AnchorVaultToken>;

  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  before(async () => {
    await connection.requestAirdrop(user1.publicKey, 1 * LAMPORTS_PER_SOL);
    await connection.requestAirdrop(user2.publicKey, 1 * LAMPORTS_PER_SOL);
  });

  it("maker", async () => {
    const { mint: mintA, ata: user1_Ata } = await createAndMint(
      provider,
      100,
      user1.publicKey,
      DECIMALS
    );
    const { mint: mintB, ata: user2_Ata } = await createAndMint(
      provider,
      100,
      user2.publicKey,
      DECIMALS
    );

    try {
      const seed = generateRandomU64Seed();

      const [escrow, escrowBump] = PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("escrow"),
          user1.publicKey.toBuffer(),
          seed.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      let vault = getAssociatedTokenAddressSync(mintA.publicKey, escrow, true);

      const accounts = {
        maker: user1.publicKey,
        mintA: mintA.publicKey,
        mintB: mintB.publicKey,

        makerAtaA: user1_Ata,
        escrow,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      };

      const receive = new anchor.BN(5 * Math.pow(10, DECIMALS));
      const amount = new anchor.BN(10 * Math.pow(10, DECIMALS));
      const tx = await program.methods
        .make(new anchor.BN(seed), amount, receive)
        .accounts(accounts)
        .signers([user1])
        .rpc();

      const escrowAccount = await program.account.escrow.fetch(escrow);

      // Check the escrow account
      expect(escrowAccount.maker).to.eql(user1.publicKey);
      expect(escrowAccount.mintA).to.eql(mintA.publicKey);
      expect(escrowAccount.mintB).to.eql(mintB.publicKey);
      expect(escrowAccount.receive.toNumber()).to.eql(receive.toNumber());
      expect(escrowAccount.bump).to.eql(escrowBump);

      // Check User Token Balance has been deducted
      let user1Amount = await connection.getTokenAccountBalance(user1_Ata);
      expect(user1Amount.value.uiAmount).to.eql(90);

      // Check Valut Token Balance has been credited
      let vaultAmount = await connection.getTokenAccountBalance(vault);
      expect(vaultAmount.value.uiAmount).to.eql(10);
    } catch (err) {
      console.error(err);
    }
  });
});
