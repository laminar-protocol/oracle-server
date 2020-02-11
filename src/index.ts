import './env';
import startFeedingPrice from './priceFeeder';
import startApi from './api';

const main = async () => {
  const polls = await startFeedingPrice();

  if (process.env.WITH_API === 'true') {
    startApi({ polls });
  }
};

main();
