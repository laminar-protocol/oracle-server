import { ApiPromise } from '@polkadot/api';
import { WsProvider, HttpProvider } from '@polkadot/rpc-provider';
import Keyring from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { stringToU8a } from '@polkadot/util';
import BN from 'bignumber.js';

import logger from '../../logger';
import { FeederKind, Listing } from '../types';

const loggerLabel = 'SubstrateFeeder';

const createProvider = (endpoint: string): WsProvider | HttpProvider => {
  if (endpoint.startsWith('ws')) {
    return new WsProvider(endpoint, true);
  }
  if (endpoint.startsWith('http')) {
    return new HttpProvider(endpoint);
  }

  logger.error({ label: loggerLabel, message: `Invalid endpoint: ${endpoint}` });
  return null;
};

const PRICE_ACCURACY = new BN('1e+18');
const withAccuracy = (rawPrice: string) =>
  new BN(rawPrice).multipliedBy(PRICE_ACCURACY).toString();

/**
 * Feed orml/oracle runtime module.
 */
export default abstract class SubstrateFeeder implements FeederKind {
  private api: ApiPromise;
  private provider: WsProvider | HttpProvider;
  private keySeed: string;
  private account: KeyringPair;
  private customTypes: Record<any, any>;

  constructor(endpoint: string, keySeed: string, customTypes: Record<any, any>) {
    this.provider = createProvider(endpoint);
    this.keySeed = keySeed;
    this.customTypes = customTypes;
  }

  public setup = async () => {
    this.api = await ApiPromise.create({
      provider: this.provider,
      types: this.customTypes,
    });
    const keyring = new Keyring({ type: 'sr25519' });
    this.account = keyring.addFromSeed(stringToU8a(this.keySeed));
  };

  abstract oracleKeyFromListing(listing: Listing): any;

  public feed = async (price: string, listing: Listing) => {
    try {
      const oracleKey = this.oracleKeyFromListing(listing);
      const tx: any = this.api.tx.oracle.feedValue(oracleKey, withAccuracy(price));
      const txHash = await tx.signAndSend(this.account);
      logger.info({ label: loggerLabel, message: `Tx successful: ${listing.symbol} price ${price}, hash ${txHash}` });
    } catch (err) {
      logger.error({ label: loggerLabel, message: `Tx failed ${listing.symbol}: ${err}` });
    }
  };
}
