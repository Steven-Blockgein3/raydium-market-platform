import fs from 'fs';
import { web3 } from "@project-serum/anchor"
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { Percent } from "@raydium-io/raydium-sdk"
import { AddressLookupTableProgram, ComputeBudgetProgram, Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction, VersionedTransaction, TransactionMessage, LAMPORTS_PER_SOL, SendOptions } from "@solana/web3.js";
import { Metaplex, amount } from "@metaplex-foundation/js";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

import axios from "axios";
export const METAPLEX = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

import { DEV_RPC, MAIN_RPC } from "./constant"

export const connection = new Connection(DEV_RPC);
export const solanaConnection = new Connection(DEV_RPC); //txHandler
export const devConnection = new Connection(DEV_RPC); //txHandler
const log = console.log;

export const sendMultiTx = async (ixs: TransactionInstruction[], wallet: Keypair): Promise<string> => {
    try {
        const transaction = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
            ...ixs
        );
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signature = await sendAndConfirmTransaction(connection, transaction, [wallet], { skipPreflight: true });
        console.log('Transaction successful with signature:', signature);
        return signature;
    } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
    }
};

export const sendSingleTx = async (ixs: TransactionInstruction[], wallet: Keypair): Promise<string> => {
    try {
        const transaction = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
            ...ixs
        );
        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signature = await sendAndConfirmTransaction(connection, transaction, [wallet], { skipPreflight: true });
        console.log('Transaction successful with signature:', signature);
        return signature;
    } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
    }
};

export const saveDataToFile = (newData: string[], filePath: string) => {
    try {
        let existingData: string[] = [];

        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // If the file exists, read its content
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            existingData = JSON.parse(fileContent);
        }

        // Add the new data to the existing array
        existingData.push(...newData);

        // Write the updated data back to the file
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    } catch (error) {
        console.log('Error saving data to JSON file:', error);
    }
};

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function calcDecimalValue(value: number, decimals: number): number {
    return value / (Math.pow(10, decimals))
}

export async function sendAndConfirmTX(tx: web3.VersionedTransaction | web3.Transaction, connection: web3.Connection) {
    const rawTx = tx.serialize()
    const options: SendOptions = {
        skipPreflight: true,
        maxRetries: 10,
    };
    
    const txSignature = await connection.sendRawTransaction(rawTx, options)
        .then(async (signature) => {
            await connection.confirmTransaction(signature, 'confirmed');
            return signature;
        })
        .catch(async (error) => {
            console.error('Transaction failed on first attempt:', error);
            await sleep(1000); // Wait for 1 second before retrying
            return connection.sendRawTransaction(rawTx, options)
                .then(async (signature) => {
                    await connection.confirmTransaction(signature, 'confirmed');
                    return signature;
                })
                .catch((txError) => {
                    console.error('Transaction failed on second attempt:', txError);
                    return null;
                });
        });

    if (txSignature) {
        console.log('Transaction confirmed with signature:', txSignature);
    } else {
        console.error('Transaction failed after retries');
    }

    return txSignature;
}

export async function getTokenMetadata(mintToken: string) {
    const metaplex = Metaplex.make(solanaConnection);

    const mintAddress = new PublicKey(mintToken);

    let tokenName;
    let tokenSymbol;
    let tokenLogo;

    const metadataAccount = metaplex
        .nfts()
        .pdas()
        .metadata({ mint: mintAddress });

    const metadataAccountInfo = await solanaConnection.getAccountInfo(metadataAccount);

    if (metadataAccountInfo) {
        const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
        tokenName = token.name;
        tokenSymbol = token.symbol;
        tokenLogo = token.json?.image;
    }
    return {
        tokenName,
        tokenSymbol,
        tokenLogo
    }
}

/** Get metaplex mint metadata account address */
export const getMetadata = async (mint: PublicKey): Promise<PublicKey> => {
    return (
        await PublicKey.findProgramAddress([Buffer.from('metadata'), METAPLEX.toBuffer(), mint.toBuffer()], METAPLEX)
    )[0];
};

export async function getTokenList(address: PublicKey) {

    const tokenList = await solanaConnection.getTokenAccountsByOwner(address, {
        programId: TOKEN_PROGRAM_ID
    });
    let data: any = [];

    if (tokenList.value.length > 0) {
        for (const item of tokenList.value) {
            const tokenAccountInfo = await solanaConnection.getParsedAccountInfo(item.pubkey);

            // @ts-ignore
            const meta = await getMetadata(new PublicKey(tokenAccountInfo.value?.data.parsed?.info.mint));

            try {
                const metdadataContent = await Metadata.fromAccountAddress(solanaConnection, meta);

                const detail = await axios.get(metdadataContent.pretty().data.uri);

                // @ts-ignore
                data.push({ ...metdadataContent.pretty(), ...detail.data, amount: tokenAccountInfo.value?.data.parsed?.info.tokenAmount.uiAmount });
            } catch (error) {
                console.log(error);
            }

        };
    }
    // console.log("data===>>>", data)

    return data;
}

export const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...' + text.substring(text.length - maxLength, text.length);
    }
    return text;
}

export const createLAT = async (wallet: any, inst: any) => {
    try {
        console.log('Starting createLAT function');

        // Check wallet balance
        const balance = await solanaConnection.getBalance(wallet.publicKey);
        console.log(`Wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);

        if (balance < 0.1 * LAMPORTS_PER_SOL) {
            throw new Error('Insufficient balance. Please ensure you have at least 0.1 SOL in your wallet.');
        }

        console.log('Creating lookup table instruction');
        const [lookupTableInst, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
            authority: wallet.publicKey,
            payer: wallet.publicKey,
            recentSlot: await solanaConnection.getSlot(),
        });

        console.log('Creating extend lookup table instruction');
        const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
            payer: wallet.publicKey,
            authority: wallet.publicKey,
            lookupTable: lookupTableAddress,
            addresses: inst, // Use the provided addresses
        });

        // Get recent prioritization fees
        console.log('Fetching recent prioritization fees');
        const recentPrioritizationFees = await solanaConnection.getRecentPrioritizationFees();
        
        // Calculate the median fee
        const sortedFees = recentPrioritizationFees
            .map(fee => fee.prioritizationFee)
            .sort((a, b) => a - b);
        const medianFee = sortedFees[Math.floor(sortedFees.length / 2)];
        
        // Add some buffer to the median fee (e.g., 20% more)
        const priorityFeeMultiplier = 1.2;
        const calculatedPriorityFee = Math.ceil(medianFee * priorityFeeMultiplier);

        console.log(`Calculated priority fee: ${calculatedPriorityFee} microLamports per CU`);

        // Add a priority fee to ensure the transaction is processed
        console.log('Adding priority fee');
        const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: calculatedPriorityFee
        });

        // Set a compute unit limit
        const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
            units: 300000 // Adjust this value based on your transaction's needs
        });

        console.log('Creating transaction message');
        const messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: (await solanaConnection.getLatestBlockhash()).blockhash,
            instructions: [computeUnitLimit, priorityFee, lookupTableInst, addAddressesInstruction]
        }).compileToV0Message();

        console.log('Creating versioned transaction');
        const fullTX = new VersionedTransaction(messageV0);

        // Log transaction details before signing
        console.log('Transaction details before signing:');
        console.log('Version:', fullTX.version);
        console.log('Signatures:', fullTX.signatures);
        console.log('Message:');
        console.log('  Header:', fullTX.message.header);
        console.log('  Account Keys:', fullTX.message.staticAccountKeys.map(key => key.toBase58()));
        console.log('  Recent Blockhash:', fullTX.message.recentBlockhash);
        console.log('  Instructions:');
        fullTX.message.compiledInstructions.forEach((instruction, index) => {
            console.log(`    Instruction ${index}:`);
            console.log('      Program ID Index:', instruction.programIdIndex);
            console.log('      Accounts:', instruction.accountKeyIndexes);
            console.log('      Data:', bs58.encode(instruction.data));
        });

        // Sign the transaction
        console.log('Signing transaction');
        if (wallet.signTransaction) {
            await wallet.signTransaction(fullTX);
        } else {
            throw new Error("Wallet doesn't support signing");
        }

        // Log transaction details after signing
        console.log('Transaction details after signing:');
        console.log('Signatures:', fullTX.signatures.map(sig => bs58.encode(sig)));

        // Simulate the transaction to check for potential errors
        console.log('Simulating transaction');
        const simulation = await solanaConnection.simulateTransaction(fullTX);
        if (simulation.value.err) {
            console.error('Simulation error:', simulation.value.err);
            throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }

        console.log('Transaction simulation successful');
        return fullTX;
    } catch (error) {
        console.error('Error in createLAT:', error);
        throw error;
    }
}

export async function fetchNetworkFeeWithRetry(connection: Connection, maxRetries = 5, retryDelay = 1000): Promise<number | null> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const { feeCalculator } = await connection.getRecentBlockhash();
            return feeCalculator.lamportsPerSignature;
        } catch (error) {
            console.error(`Failed to fetch network fee (attempt ${i + 1}/${maxRetries}):`, error);
            if (i < maxRetries - 1) {
                await sleep(retryDelay);
            }
        }
    }
    console.error('Failed to fetch network fee after all retries');
    return null;
}
