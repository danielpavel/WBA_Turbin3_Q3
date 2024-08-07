import { mintTransaction, uploadImage, uploadMetadata } from "@/utils/mint";
import {
  deletePixelArt,
  generateRandomHex,
  savePixelArt,
} from "@/utils/pixelArt";
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
} from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";

const headers = createActionHeaders();

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    title: "Mint a geneRUG",
    description:
      "Mint a one-of-a-kind digital tapestry, woven from the threads of cryptographic randomness.",
    label: "Mint geneRUG",
    icon: new URL("rugs.webp", new URL(req.url).origin).toString(),
  };

  return Response.json(payload, { headers });
};

// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = async () => {
  return new Response(null, { headers });
};

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      const message = "Invalid account provided";
      console.error(message + ` ${err}`);

      return new Response(message, { status: 400, headers });
    }

    const hash = generateRandomHex();
    const filename = `./generated/generug-${hash}.png`;
    const img = await savePixelArt(filename);

    // console.log(`Pixel art saved as ${filename}`);

    const imgUri = await uploadImage({
      image: process.env.NODE_ENV === "production" ? img : filename,
    });

    const metadataURI = await uploadMetadata({
      imageUri: imgUri,
      randomHex: hash,
    });

    const transaction = await mintTransaction({
      uri: metadataURI,
      randomHex: hash,
      account,
    });

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: toWeb3JsTransaction(transaction),
        message: "Mint geneRUG",
      },
    });

    console.log(`[GeneRUG POST] with payload: ${JSON.stringify(payload)}`);

    // Regardless of the transaction status, we delete the rug.
    if (process.env.NODE_ENV !== "production") {
      await deletePixelArt(filename);
    }

    return Response.json(payload, { headers });
  } catch (err) {
    console.error(`[GeneRUG POST] Error: ${err}`);
    return new Response("Internal Server Error", { status: 500, headers });
  }
};
