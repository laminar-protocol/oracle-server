import startFeedingPrice from './priceFeeder';

const main = () => {
  const assetPairs = [
    {
      fromAsset: 'JPY',
      toAsset: 'USD',
      key: 'fJPY',
    },
    {
      fromAsset: 'EUR',
      toAsset: 'USD',
      key: 'fEUR',
    }
  ];
  startFeedingPrice(assetPairs);
};

main();
