import logger from '../logger';
import Poll from './poll';
import { FeederKind, Polls, PollKind, Listing } from './types';

import { newEthFeeder } from './eth/feeder';
import ethListings from './eth/listings.json';
import { newAcalaFeeder } from './acala/feeder';
import acalaListings from './acala/listings.json';
import { newLaminarFeeder } from './laminar/feeder';
import laminarListings from './laminar/listings.json';

const label = 'Start Feeder';

const startWithFeeder = async (feeder: FeederKind, listings: Listing[]): Promise<PollKind | null> => {
  try {
    await feeder.setup();
    const poll = new Poll(listings, Number(process.env.PRICE_FEED_INTERVAL_MS), feeder);
    poll.start();
    return poll;
  } catch (err) {
    logger.error({ label, message: `Running feeder failed: ${JSON.stringify(err)}` });
    return null;
  }
};

const startFeedingPrice = async (): Promise<Polls> => {
  const polls = new Map();

  if (process.env.FEED_ETH === 'true') {
    const ethPoll = await startWithFeeder(newEthFeeder(), ethListings);
    polls.set('eth', ethPoll);
  }

  if (process.env.FEED_ACALA === 'true') {
    const acalaPoll = await startWithFeeder(newAcalaFeeder(), acalaListings);
    polls.set('acala', acalaPoll);
  }

  if (process.env.FEED_LAMINAR === 'true') {
    const laminarPoll = await startWithFeeder(newLaminarFeeder(), laminarListings);
    polls.set('laminar', laminarPoll);
  }

  return polls;
};

export default startFeedingPrice;
