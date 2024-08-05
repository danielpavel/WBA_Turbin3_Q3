import wallet from "../wba-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

import {
  string,
  publicKey as publicKeySerializer,
} from "@metaplex-foundation/umi/serializers";

// Define our Mint address
const mint = publicKey("8KMdYpCQrkutMjhgn7d9AWdoZZWJvnLzs7Z5A7e15nsi");

// Create a UMI connection
const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
  try {
    // Start here

    const metadata = umi.eddsa.findPda(MPL_TOKEN_METADATA_PROGRAM_ID, [
      string({ size: "variable" }).serialize("metadata"),
      publicKeySerializer().serialize(MPL_TOKEN_METADATA_PROGRAM_ID),
      publicKeySerializer().serialize(mint),
    ]);

    console.log("📢 Metadata address: ", metadata);

    let accounts: CreateMetadataAccountV3InstructionAccounts = {
      metadata,
      mint,
      mintAuthority: signer,
    };

    let data: DataV2Args = {
      name: "DPAVEL Token",
      symbol: "DPAVEL",
      uri: "https://arweave.net/dpaveltoken",
      sellerFeeBasisPoints: 500,
      creators: null,
      collection: null,
      uses: null,
    };

    let args: CreateMetadataAccountV3InstructionArgs = {
      data,
      isMutable: true,
      collectionDetails: null,
    };

    let tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });

    let result = await tx.sendAndConfirm(umi);
    console.log(bs58.encode(result.signature));
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
