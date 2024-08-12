import { Keypair, PublicKey } from "@solana/web3.js";
import { generateRandomU64Seed } from "./utils";

import { AnchorVaultToken } from "../target/types/anchor_vault_token";

import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";

import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function make(
  maker: Keypair,
  mintA: PublicKey,
  mintB: PublicKey,
  user1_Ata: PublicKey,
  receive: BN,
  amount: BN,
  program: Program<AnchorVaultToken>
) {
  const seed = generateRandomU64Seed();

  const [escrow, escrowBump] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("escrow"),
      maker.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  let vault = getAssociatedTokenAddressSync(mintA, escrow, true);

  const accounts = {
    maker: maker.publicKey,
    mintA,
    mintB,

    makerAtaA: user1_Ata,
    escrow,
    vault,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  const tx = await program.methods
    .make(new anchor.BN(seed), amount, receive)
    .accounts(accounts)
    .signers([maker])
    .rpc();

  return { escrow: { pubkey: escrow, bump: escrowBump }, vault, tx };
}

export async function refund_and_close_vault(
  maker: Keypair,
  mintA: PublicKey,
  user1_Ata: PublicKey,
  program: Program<AnchorVaultToken>,
  vault: PublicKey,
  escrow: PublicKey
) {
  const accounts = {
    maker: maker.publicKey,
    mintA,
    makerAtaA: user1_Ata,
    escrow,
    vault,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  const tx = await program.methods
    .refund()
    .accounts(accounts)
    .signers([maker])
    .rpc();

  return { tx };
}
