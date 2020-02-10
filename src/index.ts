import './env';
import startFeedingPrice from './priceFeeder';
import startApi from './api';

const main = async () => {
  const polls = await startFeedingPrice();
  startApi({ polls });
};

main();
