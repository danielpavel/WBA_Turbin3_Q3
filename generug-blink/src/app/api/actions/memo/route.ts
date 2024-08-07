import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
  MEMO_PROGRAM_ID,
} from "@solana/actions";
import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const headers = createActionHeaders();

export const GET = (req: Request) => {
  console.log(
    `Action GET Request - url: ${req.url}; origin: ${new URL(req.url).origin}`,
  );

  const payload: ActionGetResponse = {
    icon: new URL("solana_devs.jpg", new URL(req.url).origin).toString(),
    title: "On Chain Memo",
    description: "Send a message on-chain using a Memo",
    label: "Send Memo",
  };

  return Response.json(payload, { headers });
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
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

    console.log(`[Action POST] with account: ${account.toBase58()}`);

    const connection = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl("devnet"),
    );

    const transaction = new Transaction().add(
      // note: `createPostResponse` requires at least 1 non-memo instruction
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
      new TransactionInstruction({
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from("this is a simple memo message", "utf8"),
        keys: [],
      }),
    );

    transaction.feePayer = account;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: { transaction, message: "Post this message on-chain!" },
    });

    console.log(`[Action POST] with payload: ${JSON.stringify(payload)}`);

    return Response.json(payload, { headers });
  } catch (err) {
    let message = "Ooops, something went wrong";
    console.error(`${message} ${err}`);

    return new Response(message, { status: 400, headers });
  }
};
