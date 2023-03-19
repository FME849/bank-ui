// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { AnchorProvider, Program, web3, BN } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import {idl_obj} from "../idl";

export const Bank: FC = () => {
    const [banks, setBanks] = useState([]);
    const {connection} = useConnection();
    const myWallet = useWallet();
    const programId = new PublicKey(idl_obj.metadata.address);
  
    const anchorProvider = new AnchorProvider(connection, myWallet, AnchorProvider.defaultOptions());
    const program = new Program(idl_obj, programId, anchorProvider);
    
    
    const createBank = async () => {
        try {
            const [bank] = PublicKey.findProgramAddressSync([
                Buffer.from('wsos23_bank'),
                anchorProvider.wallet.publicKey?.toBuffer(),
            ], program.programId);
            
            
            await program.rpc.create("Wsos23 Bank", {
                accounts: {
                    bank,
                    user: anchorProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                }
            })
            
            console.log("Wow, new bank was created:", bank.toString());
        } catch (error) {
            console.error("Error while creating bank:", error);
        }
    };
    
    const getBanks = async () => {
      const anchorProvider = new AnchorProvider(connection, myWallet, AnchorProvider.defaultOptions());
      const program = new Program(idl_obj, programId, anchorProvider);
      try {
        Promise.all((await connection.getProgramAccounts(program.programId)).map(async bank => ({
          ...(await program.account.bank.fetch(bank.pubkey)),
          pubkey: bank.pubkey,
        }))).then(fetchedBanks => {
          setBanks(fetchedBanks)
        })
      } catch (error) {
        console.log("Error while getting banks:", error);
      }
    }

    const depositBank = async (publicKey: PublicKey) => {
        try {
            await program.rpc.deposit(new BN(0.1 * LAMPORTS_PER_SOL), {
                accounts: {
                    bank: publicKey,
                    user: anchorProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                }
            })

            console.log('Deposit done:', publicKey);
        } catch (error) {
            console.error('Error while depositing:', error);
        }
    }

    const withdrawBank = async (publicKey: PublicKey, amount: number) => {
        const bankAccountInfo = await anchorProvider.connection.getAccountInfo(publicKey)
        const minimumBalance = await anchorProvider.connection.getMinimumBalanceForRentExemption(bankAccountInfo.data.length)
        const balance = await anchorProvider.connection.getBalance(publicKey)
        try {
            await program.rpc.withdraw(new BN(balance - minimumBalance), {
                accounts: {
                    bank: publicKey,
                    user: anchorProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                }
            })

            console.log('Withdraw done:', balance);
        } catch (error) {
            console.error('Error while depositing:', error);
        }
    }

    return (
        <>
        {banks.map((bank) => {
            const balance = parseInt(bank.balance.toString());
            
            return (
            <div key={bank.pubkey} className='md:hero-content flex flex-col'>
                <h1>{bank.name.toString()}</h1>
                <span>{balance}</span>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={() => depositBank(bank.pubkey)}
                >
                    <span className="block group-disabled:hidden" > 
                       Deposit 0.1
                    </span>
                </button>
                
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={() => withdrawBank(bank.pubkey, balance)}
                >
                    <span className="block group-disabled:hidden" > 
                       Withdraw all
                    </span>
                </button>
            </div>
        )})}
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">

                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={createBank} disabled={!myWallet.publicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                       Create bank
                    </span>
                </button>


                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={getBanks} disabled={!myWallet.publicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                    Fetch bank
                    </span>
                </button>
            </div>
        </div>
        </>
    );
};
