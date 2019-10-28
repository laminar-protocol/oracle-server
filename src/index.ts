import startFeedingPrice from './priceFeeder';

const main = () => {
  const assetPairs = [
    {
      fromAsset: 'JPY',
      toAsset: 'USD',
      priceKey: 'fJPY',
    },
    {
      fromAsset: 'EUR',
      toAsset: 'USD',
      priceKey: 'fEUR',
    }
  ];
  startFeedingPrice(assetPairs);
};

main();
