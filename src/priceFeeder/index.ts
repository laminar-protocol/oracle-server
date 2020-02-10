import Poller from './poller';
import { FeederKind, PollKind, Listing } from './types';
import { newEthFeeder } from './eth/feeder';
import ethListings from './eth/listings.json';
import { newAcalaFeeder } from './acala/feeder';
import acalaListings from './acala/listings.json';
import { newLaminarFeeder } from './laminar/feeder';
import laminarListings from './laminar/listings.json';

const startWithFeeder = async (feeder: FeederKind, listings: Listing[]): Promise<PollKind> => {
  await feeder.setup();
  const poller = new Poller(listings, Number(process.env.PRICE_FEED_INTERVAL_MS), feeder);
  poller.start();

  return poller;
};

const startFeedingPrice = async (): Promise<PollKind[]> => {
  const pollers = [];

  if (process.env.FEED_ETH === 'true') {
    const ethPoller = await startWithFeeder(newEthFeeder(), ethListings);
    pollers.push(ethPoller);
  }

  if (process.env.FEED_ACALA === 'true') {
    const acalaPoller = await startWithFeeder(newAcalaFeeder(), acalaListings);
    pollers.push(acalaPoller);
  }

  if (process.env.FEED_LAMINAR === 'true') {
    const laminarPoller = await startWithFeeder(newLaminarFeeder(), laminarListings);
    pollers.push(laminarPoller);
  }

  return pollers;
};

export default startFeedingPrice;
