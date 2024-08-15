import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { AnchorVaultToken } from "../target/types/anchor_vault_token";

import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export async function take(
  taker: Keypair,
  maker: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  escrow: PublicKey,
  vault: PublicKey,
  program: Program<AnchorVaultToken>
) {
  let makerAtaB = getAssociatedTokenAddressSync(mintB, maker);
  let takerAtaA = getAssociatedTokenAddressSync(mintA, taker.publicKey);
  let takerAtaB = getAssociatedTokenAddressSync(mintB, taker.publicKey);

  const accounts = {
    taker: taker.publicKey,
    maker,
    mintA,
    mintB,
    takerAtaA,
    takerAtaB,
    makerAtaB,
    escrow,
    vault,
    tokenProgram: TOKEN_PROGRAM_ID,
  };

  const tx = await program.methods
    .take()
    // .accounts({
    //   taker: taker.publicKey,
    //   maker,
    //   mintA,
    //   mintB,
    //   takerAtaA,
    //   takerAtaB,
    //   makerAtaB,
    //   escrow,
    //   vault,
    //   tokenProgram: TOKEN_PROGRAM_ID,
    // })
    .accounts(accounts)
    .signers([taker])
    .rpc();

  return { tx };
}
