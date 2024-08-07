import { DevnetAlert } from "@/components/DevnetAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const localLink =
  "https://dial.to/devnet?action=solana-action%3Ahttp%3A%2F%2Flocalhost%3A3001%2Fapi%2Factions%2Fgenerug-mint";

const actionCards: Array<{
  title: string;
  href: string;
  description: React.ReactNode;
}> = [
  {
    title: "GeneRUG Mint",
    href: "https://dial.to/devnet?action=solana-action%3Ahttps%3A%2F%2Fgenerug-blink-nu.vercel.app%2Fapi%2Factions%2Fgenerug-mint",
    description:
      "Mint a one-of-a-kind digital tapestry, woven from the threads of cryptographic randomness.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-h-screen my-14 flex max-w-[58rem] flex-col items-center justify-between space-y-6 text-center">
      <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
        GeneRUG Blink
      </h2>
      <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
        mint rare™ and exotic™ rugs via Solana Blinks and Actions
      </p>

      <DevnetAlert />

      <div className="mx-4 grid justify-center grid-cols-1 max-w-md py-6">
        {actionCards.map((item, key) => (
          <Link key={key} href={item.href} className="group" target="_blank">
            <Card className="rounded-2xl group-hover:border-primary shadow-xl">
              <CardHeader>
                <Image
                  src={"/rugs.webp"}
                  width={512}
                  height={512}
                  alt="rugs"
                ></Image>
                <CardTitle className="space-y-3">
                  <span className="block font-bold group-hover:text-pretty">
                    {item.title}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="w-full border-t border-t-black">
        <div className="flex justify-between">
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-sm sm:leading-7">
            Made with 💚 by {""}
            <span>
              <Link
                className="hover:underline hover:cursor-pointer"
                href={"https://x.com/_danielpavel"}
                target="_blank"
                prefetch={false}
              >
                Daniel Pavel
              </Link>
            </span>
          </p>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-sm sm:leading-7">
            Insipred from {""}
            <span>
              <Link
                className="hover:underline hover:cursor-pointer"
                href={"https://github.com/deanmlittle/generug"}
                target="_blank"
                prefetch={false}
              >
                deanmlittle&apos;s generug
              </Link>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
