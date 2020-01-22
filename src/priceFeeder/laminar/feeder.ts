import { types as laminarTypes } from '@laminar/types';
import { CurrencyId } from '@acala-network/types/interfaces';

import { Listing } from '../types';
import currencyIds from './currencyIds.json';
import SubstrateFeeder from '../substrate/feeder';

export default class LaminarFeeder extends SubstrateFeeder {
  // eslint-disable-next-line class-methods-use-this
  oracleKeyFromListing({ symbol }: Listing): CurrencyId {
    return (currencyIds as any)[symbol];
  }
}

export const newLaminarFeeder = () => {
  const keySeed = process.env.SUB_KEY_SEED;
  const endpoint = process.env.SUB_ENDPOINT;
  return new LaminarFeeder(endpoint, keySeed, laminarTypes);
};
