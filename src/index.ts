import './env';
import startFeedingPrice from './priceFeeder';
import startApp from './app';

const main = async () => {
  const pollers = await startFeedingPrice();
  startApp({ pollers });
};

main();
