import logger from '../logger';
import fetchPrice from './fetchPrice';
import { Listing, FeederKind } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default class Poller {
  private listings: Listing[];
  private feeder: FeederKind;

  private intervalByMs: number;
  private continue: boolean;

  constructor(listings: Listing[], intervalByMs: number, feeder: FeederKind) {
    this.listings = listings;
    this.feeder = feeder;
    this.intervalByMs = intervalByMs;
    this.continue = false;
  }

  public start = () => {
    logger.info('start feeding price...');
    logger.info('--------------------------');
    logger.info(`Interval by seconds: ${this.intervalByMs / 1000}`);
    logger.info(`Listings: ${this.listings.map((l) => l.symbol).join(', ')}`);
    logger.info('--------------------------');

    this.continue = true;
    this.poll();
  };

  public stop = () => {
    logger.info('stop feeding price...');
    this.continue = false;
  };

  private poll = async () => {
    while (this.continue) {
      for (const listing of this.listings) {
        await this.fetchThenFeed(listing);
      }
      await sleep(this.intervalByMs);
    }
  };

  private fetchThenFeed = async (listing: Listing) => {
    try {
      const price = await fetchPrice(listing);
      await this.feeder.feed(price, listing);
    } catch (err) {
      logger.error(`${err}`);
    }
  };
}
