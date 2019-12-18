import { types as acalaTypes } from '@acala-network/types';
import { CurrencyId } from '@acala-network/types/interfaces';

import { Listing } from '../types';
import currencyIds from './currencyIds.json';
import SubstrateFeeder from '../substrate/feeder';

export default class AcalaFeeder extends SubstrateFeeder {
  // eslint-disable-next-line class-methods-use-this
  oracleKeyFromListing({ symbol }: Listing): CurrencyId {
    return (currencyIds as any)[symbol];
  }
}

export const newAcalaFeeder = () => {
  const keySeed = process.env.SUB_KEY_SEED;
  const endpoint = process.env.SUB_ENDPOINT;
  return new AcalaFeeder(endpoint, keySeed, acalaTypes);
};
