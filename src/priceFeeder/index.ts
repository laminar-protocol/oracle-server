import Poller from './poller';
import listings from './listings.json';
import { FeederKind } from './types';
import { newEthFeeder } from './eth/feeder';
import { newAcalaFeeder } from './acala/feeder';

const startWithFeeder = async (feeder: FeederKind) => {
  await feeder.setup();
  const poller = new Poller(listings, Number(process.env.PRICE_FEED_INTERVAL_MS), feeder);
  poller.start();
};

const startFeedingPrice = async () => {
  if (process.env.FEED_ETH === 'true') {
    await startWithFeeder(newEthFeeder());
  }

  if (process.env.FEED_ACALA === 'true') {
    await startWithFeeder(newAcalaFeeder());
  }
};

export default startFeedingPrice;
