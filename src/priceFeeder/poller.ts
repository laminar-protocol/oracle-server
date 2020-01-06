import logger from '../logger';
import fetchPrice from './fetchPrice';
import { Listing, FeederKind } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const loggerLabel = 'Poller';

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
    logger.info({ label: loggerLabel, message: 'Start feeding price...' });
    logger.info({ label: loggerLabel, message: `Interval by seconds: ${this.intervalByMs / 1000}` });
    logger.info({ label: loggerLabel, message: `Listings: ${this.listings.map((l) => l.symbol).join(', ')}` });

    this.continue = true;
    this.poll();
  };

  public stop = () => {
    logger.info({ label: loggerLabel, message: 'Stop feeding price' });
    this.continue = false;
  };

  private poll = async () => {
    while (this.continue) {
      let startingNonce: number;
      try {
        startingNonce = await this.feeder.nonce();
      } catch (err) {
        logger.error({ lable: loggerLabel, message: 'Fetching nonce failed.' });
        continue; // eslint-disable-line
      }

      await Promise.all(this.listings.map((listing, index) => this.fetchThenFeed(listing, startingNonce + index)));

      await sleep(this.intervalByMs);
    }
  };

  private fetchThenFeed = async (listing: Listing, nonce: number) => {
    try {
      const price = await fetchPrice(listing);
      await this.feeder.feed(price, listing, nonce);
    } catch (err) {
      logger.error({ label: 'Fetch and feed', message: `${err}` });
    }
  };
}
