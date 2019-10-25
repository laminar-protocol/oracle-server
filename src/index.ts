import startFeedingPrice from './priceFeeder';

const main = () => {
  const assetPairs = [
    {
      fromAsset: 'USD',
      toAsset: 'JPY',
    },
  ];
  startFeedingPrice(assetPairs);
};

main();
