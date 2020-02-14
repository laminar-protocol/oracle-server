import logger from '../logger';
import fetchPrice from './fetchPrice';
import { Listing, FeederKind, PollKind } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const label = 'Poll';

export default class Poll implements PollKind {
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
    logger.info({ label, message: 'Start feeding price...' });
    logger.info({ label, message: `Interval by seconds: ${this.intervalByMs / 1000}` });
    logger.info({ label, message: `Listings: ${this.listings.map((l) => l.symbol).join(', ')}` });

    this.continue = true;
    this.poll();
  };

  public stop = () => {
    logger.info({ label, message: 'Stop feeding price' });
    this.continue = false;
  };

  public summary = (): any => ({
    isRunning: this.continue,
    listings: this.listings,
    intervalByMs: this.intervalByMs,
  });

  private poll = async () => {
    while (this.continue) {
      await this.fetchThenFeed();
      await sleep(this.intervalByMs);
    }
  };

  private fetchThenFeed = async () => {
    try {
      const prices = await Promise.all(this.listings.map((l) => fetchPrice(l)));
      await this.feeder.feed(prices, this.listings);
    } catch (err) {
      logger.error({ label, message: `Fetch then feed failed: ${err}` });
    }
  };
}
