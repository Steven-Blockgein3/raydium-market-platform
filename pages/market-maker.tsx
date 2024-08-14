import React from 'react';
import MarketMaker from '../components/MarketMaker';

const MarketMakerPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Market Maker</h1>
      <MarketMaker />
    </div>
  );
};

export default MarketMakerPage;