import Poller from './poller';
import listings from './listings.json';
import { newEthFeeder } from './eth/feeder';

const startFeedingPrice = () => {
  if (process.env.FEED_ETH === 'true') {
    const ethFeeder = newEthFeeder();
    const poller = new Poller(listings, Number(process.env.PRICE_FEED_INTERVAL_MS), ethFeeder);
    poller.start();
  }

  // TODO: feed ACALA and Flowchain
};

export default startFeedingPrice;
