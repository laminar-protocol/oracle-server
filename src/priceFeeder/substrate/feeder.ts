import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { WsProvider, HttpProvider } from '@polkadot/rpc-provider';
import Keyring from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
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
  new BN(rawPrice).multipliedBy(PRICE_ACCURACY).toFixed();

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
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    this.account = keyring.addFromUri(this.keySeed);
  };

  abstract oracleKeyFromListing(listing: Listing): any;

  public feed = async (prices: string[], listings: Listing[], nonce: number): Promise<void> => {
    try {
      const zipped = prices.map((p, i) => [
        this.oracleKeyFromListing(listings[i]),
        withAccuracy(p),
      ]);
      const tx: any = this.api.tx.oracle.feedValues(zipped);

      const unsub = await tx.signAndSend(this.account, { nonce }, (result: SubmittableResult) => {
        if (result.status.isFinalized) {
          let extrinsicFailed = false;
          result.events.forEach(({ event: { method, section } }) => {
            if (section === 'system' && method === 'ExtrinsicFailed') {
              extrinsicFailed = true;
              logger.error({
                label: loggerLabel,
                message: `Feeding failed, block hash ${result.status.asFinalized}`,
              });
            }
          });

          if (!extrinsicFailed) {
            const summary = listings.map((l, i) => `${l.symbol} ${prices[i]}`).join(', ');
            logger.info({
              label: loggerLabel,
              message: `Feeding success: ${summary}, block hash ${result.status.asFinalized}`,
            });
          }

          unsub();
        }
      });
    } catch (err) {
      logger.error({ label: loggerLabel, message: `Invalid tx ${listings.map((l) => l.symbol).join(' ')}: ${err}` });
    }
  };

  public nonce = async (): Promise<number> => {
    const nonceIndex = await this.api.query.system.accountNonce(this.account.address);
    return nonceIndex.toNumber();
  }
}
