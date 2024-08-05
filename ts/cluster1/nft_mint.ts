import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../wba-wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);
const ImageURI =
  "https://arweave.net/GY4O0BErAEskwEvBtAci2UrseLnXAJevt_zCK4K9VEk";

(async () => {
  try {
    let tx = createNft(umi, {
      name: "Daniel's RUG",
      mint,
      authority: myKeypairSigner,
      sellerFeeBasisPoints: percentAmount(5),
      isCollection: false,
      uri: ImageURI,
    });

    let result = await tx.sendAndConfirm(umi);

    const signature = base58.encode(result.signature);

    console.log(
      `Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );

    console.log("Mint Address: ", mint.publicKey);
  } catch (error) {
    console.log(`Oops.. Something went wrong ${error}`);
  }
})();

