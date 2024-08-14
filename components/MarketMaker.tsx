import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const MarketMaker: React.FC = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [strategy, setStrategy] = useState('');
  const { publicKey } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert('Please connect your wallet');
      return;
    }

    try {
      // Validate token address
      new PublicKey(tokenAddress);

      // Add strategy to Firestore
      if (db) {
        await addDoc(collection(db, 'marketMakerStrategies'), {
          tokenAddress,
          strategy,
          userAddress: publicKey.toString(),
          createdAt: new Date(),
        });

        alert('Strategy added successfully');
        setTokenAddress('');
        setStrategy('');
      } else {
        throw new Error('Firestore is not initialized');
      }
    } catch (error) {
      console.error('Error adding strategy:', error);
      alert('Error adding strategy. Please check the token address and try again.');
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Market Maker</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tokenAddress" className="block text-gray-700 text-sm font-bold mb-2">Token Address</label>
          <input
            type="text"
            id="tokenAddress"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="strategy" className="block text-gray-700 text-sm font-bold mb-2">Trading Strategy</label>
          <textarea
            id="strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
            required
          ></textarea>
        </div>
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Add Strategy
        </button>
      </form>
    </div>
  );
};

export default MarketMaker;