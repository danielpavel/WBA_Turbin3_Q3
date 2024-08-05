import bs58 from "bs58";
import commander from "commander";

const program = new commander.Command();
program
  .name("Wallet Address Converter")
  .description("CLI tool to convert between different wallet address formats")
  .version("1.0.0");

program
  .command("base58_to_wallet")
  .description("Convert from base58 to wallet")
  .argument("<base58_string>", "base58 representation of the wallet address")
  .action((str, options) => {
    const wallet = bs58.decode(str);
    console.log("[base58_to_wallet] The wallet address is: ", wallet);
  });

program
  .command("wallet_to_base58")
  .description("Convert from wallet to base58")
  .argument(
    "<wallet_array>",
    "Comma separated array representation of the wallet",
  )
  .action((str, options) => {
    const buffer = str.split(",").map((x: string) => parseInt(x));
    const wallet = bs58.encode(buffer);

    console.log("[wallet_to_base58] The wallet address is: ", wallet);
  });

program.parse();
