import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVaultToken } from "../target/types/anchor_vault_token";

import { Keypair } from "@solana/web3.js";
import { createAndMint } from "./utils";

describe("anchor_vault_token", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();
  const connection = provider.connection;

  const program = anchor.workspace
    .AnchorVaultToken as Program<AnchorVaultToken>;

  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  it("Create Mint and Tokens", async () => {
    await createAndMint(provider, 100, user1.publicKey);
    await createAndMint(provider, 200, user2.publicKey);
  });
});
