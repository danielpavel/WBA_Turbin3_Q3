mod programs;

#[cfg(test)]
mod tests {
    use super::*;

    use crate::programs::wba_prereqs::{CompleteArgs, WbaPrereqProgram};
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::{
        message::Message,
        pubkey::Pubkey,
        signature::{read_keypair_file, Keypair, Signer},
    };
    use solana_sdk::{system_instruction::transfer, system_program, transaction::Transaction};

    use bs58;
    use std::io::{self, BufRead};

    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com";

    #[test]
    fn keygen() {
        let kp = Keypair::new();
        println!(
            "You've generated a new Solana wallet: {}",
            kp.pubkey().to_string()
        );
        println!("");
        println!("To save your wallet, copy and paste the following into a JSON file:");
        println!("{:?}", kp.to_bytes());
    }

    #[test]
    fn wallet_to_base58() {
        println!("Input your private key as a wallet byte array:");
        let stdin = io::stdin();
        let wallet = stdin
            .lock()
            .lines()
            .next()
            .unwrap()
            .unwrap()
            .trim_start_matches('[')
            .trim_end_matches(']')
            .split(',')
            .map(|s| s.trim().parse::<u8>().unwrap())
            .collect::<Vec<u8>>();
        println!("Your private key is:");
        let base58 = bs58::encode(wallet).into_string();
        println!("{:?}", base58);
    }

    #[test]
    fn base58_to_wallet() {
        println!("Input your private key as base58:");

        let stdin = io::stdin();

        let base58 = stdin.lock().lines().next().unwrap().unwrap();

        println!("Your wallet file is:");
        let wallet = bs58::decode(base58).into_vec();

        match wallet {
            Ok(w) => println!("{:?}", w),
            Err(e) => println!("Error: {:?}", e),
        }
    }

    #[test]
    fn airdrop() {
        let kp = match read_keypair_file("dev-wallet.json") {
            Ok(kp) => kp,
            Err(e) => {
                println!("Error: {:?}", e);
                return;
            }
        };

        println!("Wallet loaded: {:?}", kp.pubkey());

        let client = RpcClient::new(RPC_URL);

        match client.request_airdrop(&kp.pubkey(), 2 * 1_000_000_000u64) {
            Ok(sig) => {
                println!(
                    "Airdrop successful: https://explorer.solana.com/tx/{}?cluster=devnet",
                    sig.to_string()
                );
            }
            Err(e) => {
                println!("Ooops, something went wrong {:?}", e);
            }
        }
    }

    #[test]
    fn transfer_sol() {
        let kp = match read_keypair_file("dev-wallet.json") {
            Ok(kp) => kp,
            Err(e) => {
                println!("Error: {:?}", e);
                return;
            }
        };

        let to_pubkey = Pubkey::from_str("9j3uYxDQdgZxncwHrtroGPwo9qw9RhbBJpnhcbkNsafT").unwrap();
        let client = RpcClient::new(RPC_URL);

        let balance = client
            .get_balance(&kp.pubkey())
            .expect("Failed to get balance!");
        let latest_blockhash = client
            .get_latest_blockhash()
            .expect("Failed to get blockhash");

        let message = Message::new_with_blockhash(
            &[transfer(&kp.pubkey(), &to_pubkey, balance)],
            Some(&kp.pubkey()),
            &latest_blockhash,
        );

        // Calculate exact fee rate to transfer entire SOL amount out of account minus fees
        let fee = client
            .get_fee_for_message(&message)
            .expect("Failed to get fee calculator");

        let tx = Transaction::new_signed_with_payer(
            &[transfer(&kp.pubkey(), &to_pubkey, balance - fee)],
            Some(&kp.pubkey()),
            &vec![kp],
            latest_blockhash,
        );

        let sig = client
            .send_and_confirm_transaction(&tx)
            .expect("Failed to send tx");

        println!(
            "Success, Check out tx here: https://explorer.solana.com/tx/{}?cluster=devnet",
            sig.to_string()
        );
    }

    #[test]
    fn complete() {
        let signer = match read_keypair_file("wba-wallet.json") {
            Ok(kp) => kp,
            Err(e) => {
                println!("Error: {:?}", e);
                return;
            }
        };

        let rpc_client = RpcClient::new(RPC_URL);
        let prereq = WbaPrereqProgram::derive_program_address(&[
            b"prereq",
            signer.pubkey().to_bytes().as_ref(),
        ]);

        let args = CompleteArgs {
            github: b"danielpavel".to_vec(),
        };

        let accounts: [&Pubkey; 3] = [&signer.pubkey(), &prereq, &system_program::id()];

        // get latest blockhash
        let blockhash = rpc_client
            .get_latest_blockhash()
            .expect("Failed to get recent blockhash");

        let tx = WbaPrereqProgram::complete(
            &accounts,
            &args,
            Some(&signer.pubkey()),
            &[&signer],
            blockhash,
        );

        let sig = rpc_client
            .send_and_confirm_transaction(&tx)
            .expect("Failed to send tx");

        println!(
            "Success! Check out your TX here: https://explorer.solana.com/tx/{}/?cluster=devnet",
            sig
        );
    }
}
