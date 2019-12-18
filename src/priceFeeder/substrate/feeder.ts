import { ApiPromise } from '@polkadot/api';
import { WsProvider, HttpProvider } from '@polkadot/rpc-provider';
import Keyring from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bignumber.js';

import logger from '../../logger';
import { FeederKind, Listing } from '../types';

const createProvider = (endpoint: string): WsProvider | HttpProvider => {
  if (endpoint.startsWith('wss') || endpoint.startsWith('ws')) {
    return new WsProvider(endpoint, true);
  }
  if (endpoint.startsWith('https') || endpoint.startsWith('http')) {
    return new HttpProvider(endpoint);
  }

  return null;
};

const PRICE_ACCURACY = new BN('1e+18');
const withAccuracy = (rawPrice: string) =>
  new BN(rawPrice).multipliedBy(PRICE_ACCURACY).toString();

const loggerLabel = 'SubstrateFeeder';

export default class SubstrateFeeder implements FeederKind {
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
    // TODO: `addFromSeed`
    this.account = keyring.addFromUri(this.keySeed);
  };

  public feed = async (price: string, { symbol }: Listing) => {
    const tx = this.api.tx.oracle.feedValue(symbol, withAccuracy(price));
    try {
      const txHash = await tx.signAndSend(this.account);
      logger.info({ label: loggerLabel, message: `Tx successful: ${symbol} price ${price}, hash ${txHash}` });
    } catch (err) {
      logger.error({ label: loggerLabel, message: `Tx failed ${symbol}: ${err}` });
    }
  };
}

export const newSubstrateFeeder = (customTypes: Record<any, any>) => {
  const endpoint = process.env.SUB_ENDPOINT;
  const keySeed = process.env.SUB_KEY_SEED;
  return new SubstrateFeeder(endpoint, keySeed, customTypes);
};
