import Poller from './poller';
import { FeederKind, Listing } from './types';
import { newEthFeeder } from './eth/feeder';
import ethListings from './eth/listings.json';
import { newAcalaFeeder } from './acala/feeder';
import acalaListings from './acala/listings.json';
import { newLaminarFeeder } from './laminar/feeder';
import laminarListings from './laminar/listings.json';

const startWithFeeder = async (feeder: FeederKind, listings: Listing[]) => {
  await feeder.setup();
  const poller = new Poller(listings, Number(process.env.PRICE_FEED_INTERVAL_MS), feeder);
  poller.start();
};

const startFeedingPrice = async () => {
  if (process.env.FEED_ETH === 'true') {
    await startWithFeeder(newEthFeeder(), ethListings);
  }

  if (process.env.FEED_ACALA === 'true') {
    await startWithFeeder(newAcalaFeeder(), acalaListings);
  }

  if (process.env.FEED_LAMINAR === 'true') {
    await startWithFeeder(newLaminarFeeder(), laminarListings);
  }
};

export default startFeedingPrice;
