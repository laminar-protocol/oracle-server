import { types as acalaTypes } from '@acala-network/types';
import { CurrencyId } from '@acala-network/types/interfaces';

import { Listing } from '../types';
import currencyIds from './currencyIds.json';
import SubstrateFeeder from '../substrate/feeder';

import swap from '../../swap/index';

export default class AcalaFeeder extends SubstrateFeeder {
  // eslint-disable-next-line class-methods-use-this
  oracleKeyFromListing({ symbol }: Listing): CurrencyId {
    return (currencyIds as any)[symbol];
  }

  async onNewPrices(prices: string[], listings: Listing[], nonce: number) {
    await this.swap(prices[0], listings[0], nonce);
  }

  async swap(priceStr: string, listing: Listing, nonce: number) {
    await swap(this.api, this.account, priceStr, listing, nonce);
  }
}

export const newAcalaFeeder = () => {
  const keySeed = process.env.SUB_KEY_SEED;
  const endpoint = process.env.SUB_ENDPOINT;
  return new AcalaFeeder(endpoint, keySeed, acalaTypes);
};
