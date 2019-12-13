import { config as dotenvConfig } from 'dotenv';

import startFeedingPrice from './priceFeeder';

const main = () => {
  dotenvConfig();
  startFeedingPrice();

  // TODO: add monitoring
};

main();
