import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVaultToken } from "../target/types/anchor_vault_token";

import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import { make, refund_and_close_vault } from "./maker";
import { createAndMint } from "./utils";
import { take } from "./taker";

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

  let mintA, user1_Ata, mintB, user2_Ata;

  before(async () => {
    await connection.requestAirdrop(user1.publicKey, 1 * LAMPORTS_PER_SOL);
    await connection.requestAirdrop(user2.publicKey, 1 * LAMPORTS_PER_SOL);

    const { mint: mintA_, ata: user1_Ata_ } = await createAndMint(
      provider,
      100,
      user1.publicKey,
      DECIMALS
    );
    const { mint: mintB_, ata: user2_Ata_ } = await createAndMint(
      provider,
      100,
      user2.publicKey,
      DECIMALS
    );

    mintA = mintA_;
    mintB = mintB_;
    user1_Ata = user1_Ata_;
    user2_Ata = user2_Ata_;
  });

  it("make", async () => {
    try {
      const receive = new anchor.BN(5 * Math.pow(10, DECIMALS));
      const amount = new anchor.BN(10 * Math.pow(10, DECIMALS));

      const { escrow, vault, tx } = await make(
        user1,
        mintA.publicKey,
        mintB.publicKey,
        user1_Ata,
        receive,
        amount,
        program
      );

      const escrowAccount = await program.account.escrow.fetch(escrow.pubkey);

      // Check the escrow account
      expect(escrowAccount.maker).to.eql(user1.publicKey);
      expect(escrowAccount.mintA).to.eql(mintA.publicKey);
      expect(escrowAccount.mintB).to.eql(mintB.publicKey);
      expect(escrowAccount.receive.toNumber()).to.eql(receive.toNumber());
      expect(escrowAccount.bump).to.eql(escrow.bump);

      // Check User Token Balance has been deducted
      let user1Amount = await connection.getTokenAccountBalance(user1_Ata);
      expect(user1Amount.value.uiAmount).to.eql(90);

      // Check Valut Token Balance has been credited
      let vaultAmount = await connection.getTokenAccountBalance(vault);
      expect(vaultAmount.value.uiAmount).to.eql(10);

      console.log("🟢 Tx signature:", tx);
    } catch (err) {
      console.error(err);
    }
  });

  it("make and refund", async () => {
    try {
      const receive = new anchor.BN(5 * Math.pow(10, DECIMALS));
      const amount = new anchor.BN(10 * Math.pow(10, DECIMALS));

      const {
        escrow,
        vault,
        tx: makeTx,
      } = await make(
        user1,
        mintA.publicKey,
        mintB.publicKey,
        user1_Ata,
        receive,
        amount,
        program
      );

      console.log("🟢 Make tx signature:", makeTx);

      const escrowAccount = await program.account.escrow.fetch(escrow.pubkey);

      // Check the escrow account
      expect(escrowAccount.maker).to.eql(user1.publicKey);
      expect(escrowAccount.mintA).to.eql(mintA.publicKey);
      expect(escrowAccount.mintB).to.eql(mintB.publicKey);
      expect(escrowAccount.receive.toNumber()).to.eql(receive.toNumber());
      expect(escrowAccount.bump).to.eql(escrow.bump);

      let user1Amount;
      let vaultAmount;

      // Check User Token Balance has been deducted
      user1Amount = await connection.getTokenAccountBalance(user1_Ata);
      expect(user1Amount.value.uiAmount).to.eql(80);

      // Check Valut Token Balance has been credited
      vaultAmount = await connection.getTokenAccountBalance(vault);
      expect(vaultAmount.value.uiAmount).to.eql(10);

      // Refund
      const { tx: refundTx } = await refund_and_close_vault(
        user1,
        mintA,
        user1_Ata,
        program,
        vault,
        escrow.pubkey
      );

      // Check User Token Balance has been restored
      user1Amount = await connection.getTokenAccountBalance(user1_Ata);
      expect(user1Amount.value.uiAmount).to.eql(90);

      // Check Valut Token has been closed (aka null)
      const vaultAccount = await connection.getAccountInfo(vault);
      expect(vaultAccount).to.eql(null);

      console.log("🟢 Refund tx signature:", refundTx);
    } catch (err) {
      console.error(err);
    }
  });

  it("make and take", async () => {
    try {
      const receive = new anchor.BN(5 * Math.pow(10, DECIMALS));
      const amount = new anchor.BN(10 * Math.pow(10, DECIMALS));

      const {
        escrow,
        vault,
        tx: makeTx,
      } = await make(
        user1,
        mintA.publicKey,
        mintB.publicKey,
        user1_Ata,
        receive,
        amount,
        program
      );

      let user1Amount;
      let user2Amount;

      // Check User Token Balance has been deducted
      user1Amount = await connection.getTokenAccountBalance(user1_Ata);
      expect(user1Amount.value.uiAmount).to.eql(80);

      console.log("🟢 Make tx signature:", makeTx);

      const { tx } = await take(
        user2,
        user1.publicKey,
        mintA.publicKey,
        mintB.publicKey,
        escrow.pubkey,
        vault,
        program
      );

      // Check Valut Token Balance has been credited
      user2Amount = await connection.getTokenAccountBalance(user2_Ata);
      expect(user2Amount.value.uiAmount).to.eql(95);

      // Check Valut Token has been closed (aka null)
      const vaultAccount = await connection.getAccountInfo(vault);
      expect(vaultAccount).to.eql(null);

      console.log("🟢 Take tx signature:", tx);
    } catch (err) {
      console.error(err);
    }
  });
});
