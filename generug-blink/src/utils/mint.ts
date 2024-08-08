import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import path from "path";

import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
  createGenericFile,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import { clusterApiUrl, PublicKey } from "@solana/web3.js";

import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { readFile } from "fs/promises";
import {
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const umi = createUmi(clusterApiUrl("devnet"));

let keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(JSON.parse(process.env.WALLET || "[]")),
);

const myKeypairSigner = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

const uploader = createBundlrUploader(umi);

export async function uploadImage({ image }: { image: string | Buffer }) {
  try {
    let imgBuffer: Buffer;

    if (image instanceof Buffer) {
      // We're on production, so we upload image from buffer.
      imgBuffer = image;
    } else if (typeof image === "string") {
      const filePath = path.join(process.cwd(), "public", "generated", image);

      //1. Load image
      imgBuffer = await readFile(filePath);
    } else {
      throw Error("Invalid image type");
    }

    //2. Convert image to generic file.
    const imageConverted = createGenericFile(
      new Uint8Array(imgBuffer),
      "image/png",
    );

    //3. Upload image
    const [myUri] = await umi.uploader.upload([imageConverted]);

    console.log("[uploadImage] Your image URI: ", myUri);

    return myUri;
  } catch (error) {
    const message = "[uploadFile] Oops.. Something went wrong";
    throw Error(`${message} ${error}`);
  }
}

export async function uploadMetadata({
  randomHex,
  imageUri,
}: {
  imageUri: string;
  randomHex: string;
}) {
  try {
    const metadata = {
      name: `Generug ${randomHex.slice(0, 4)}...${randomHex.slice(
        randomHex.length - 4,
        randomHex.length,
      )}`,
      symbol: "GRUG",
      description:
        "This RUG is one-of-a-kind digital tapestry, woven from the threads of cryptographic randomness.",
      image: imageUri,
      attributes: [{ trait_type: "hash", value: randomHex }],
      properties: {
        files: [
          {
            type: "image/png",
            uri: imageUri,
          },
        ],
      },
      creators: [],
    };

    const myUri = await uploader.uploadJson(metadata);

    console.log("Your metadata URI: ", myUri);

    return myUri;
  } catch (error) {
    const message = "[uploadMetadata] Oops.. Something went wrong";
    throw Error(`${message} ${error}`);
  }
}

export async function mintTransaction({
  randomHex,
  uri,
  account,
}: {
  randomHex: string;
  uri: string;
  account: PublicKey;
}) {
  const mint = generateSigner(umi);

  try {
    // Generate ATA for the NFT owner
    const ata = await getAssociatedTokenAddress(
      toWeb3JsPublicKey(mint.publicKey),
      account,
    );
    const owner = fromWeb3JsPublicKey(account);

    const signedTx = await createNft(umi, {
      name: `Generug ${randomHex.slice(0, 4)}...${randomHex.slice(
        randomHex.length - 4,
        randomHex.length,
      )}`,
      mint,
      token: fromWeb3JsPublicKey(ata),
      tokenOwner: owner,
      authority: myKeypairSigner,
      sellerFeeBasisPoints: percentAmount(5),
      isCollection: false,
      uri,
    }).buildAndSign(umi);

    return signedTx;
  } catch (error) {
    const message = "[mintTransaction] Oops.. Something went wrong";
    throw Error(`${message} ${error}`);
  }
}
