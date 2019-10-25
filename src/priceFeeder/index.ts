import { AssetPairs } from './types';
import PriceFeeder from './priceFeeder';

const startFeedingPrice = (assetPairs: AssetPairs) => {
  const priceFeeder = new PriceFeeder(assetPairs);
  priceFeeder.start();
};

export default startFeedingPrice;
