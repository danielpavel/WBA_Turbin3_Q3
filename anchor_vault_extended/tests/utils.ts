import { Provider, BN } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMint,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import * as crypto from "crypto";

export async function createAndMint(
  provider: Provider,
  amount: number,
  user: PublicKey,
  decimals: number = 6
) {
  const payer = provider;
  const connection = provider.connection;

  const mint = Keypair.generate();

  let createMintTx = new Transaction().add(
    // create mint account
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    // init mint account
    createInitializeMintInstruction(
      mint.publicKey, // mint pubkey
      decimals,
      payer.publicKey, // mint authority
      null // freeze authority
    )
  );

  const creatMintSig = await provider.sendAndConfirm(createMintTx, [mint]);
  console.log(`✅ Created mint: ${mint.publicKey.toBase58()}`);

  let ata = getAssociatedTokenAddressSync(mint.publicKey, user);

  let createAtaTx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey, // payer
      ata, // ata
      user, // owner
      mint.publicKey // mint
    )
  );

  const createAtaSig = await provider.sendAndConfirm(createAtaTx);
  console.log(`✅ Created token Associate Token Account: ${ata.toBase58()}`);

  // mint tokens
  let mintTx = new Transaction().add(
    createMintToCheckedInstruction(
      mint.publicKey, // mint
      ata, // receiver (should be a token account)
      payer.publicKey, // mint authority
      amount * Math.pow(10, decimals), // amount. if your decimals is 8, you mint 10^8 for 1 token.
      decimals // decimals
    )
  );

  await provider.sendAndConfirm(mintTx);
  console.log(`✅ Minted ${amount} tokens to ${ata.toBase58()}`);

  return { mint, ata };
}

export function generateRandomHex(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function generateRandomU64Seed(): BN {
  const randomBytes = Keypair.generate().secretKey.slice(0, 8);

  return new BN(randomBytes);
}
