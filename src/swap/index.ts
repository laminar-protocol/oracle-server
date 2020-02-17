import BN from 'bignumber.js';

import { ApiPromise, WsProvider, SubmittableResult } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { types as acalaTypes } from '@acala-network/types';

import logger from '../logger';
import { Listing } from '../priceFeeder/types';
import currencyIds from '../priceFeeder/acala/currencyIds.json';

import fetchPrice from '../priceFeeder/fetchPrice';

const label = 'Swap';

const swapRatio = new BN('0.02');
const BASE_CURRENCY_ID = 'AUSD';

const swap = async (api: ApiPromise, account: KeyringPair, priceStr: string, { symbol }: Listing, nonce: number) => {
  const price = new BN(priceStr);

  const currencyId = (currencyIds as any)[symbol];
  const pool: any = await api.query.dex.liquidityPool(currencyId);
  const [listingAmount, baseAmount]: [BN, BN] = pool.map((x: any) => new BN(x.toString()));
  const dexPrice = baseAmount.div(listingAmount);

  const gapRatio = price.minus(dexPrice).div(price).abs();
  if (gapRatio.isLessThan(swapRatio)) {
    return;
  }

  const constProduct = listingAmount.multipliedBy(baseAmount);

  const newBaseAmount = constProduct.multipliedBy(price).squareRoot().integerValue();
  const newListingAmount = constProduct.div(newBaseAmount).integerValue();

  let tx;
  // if dex price is low, buy listing; else sell listing.
  if (dexPrice < price) {
    const supplyAmount = baseAmount.minus(newBaseAmount).toFixed();
    const targetAmount = newListingAmount.minus(baseAmount).toFixed();
    tx = api.tx.dex.swapCurrency([BASE_CURRENCY_ID, supplyAmount], [currencyId, targetAmount]);
  } else {
    const supplyAmount = newListingAmount.minus(baseAmount).toFixed();
    const targetAmount = baseAmount.minus(newBaseAmount).toFixed();
    tx = api.tx.dex.swapCurrency([currencyId, supplyAmount], [BASE_CURRENCY_ID, targetAmount]);
  }

  try {
    const unsub = await tx.signAndSend(account, { nonce }, (result: SubmittableResult) => {
      if (result.status.isFinalized) {
        let extrinsicFailed = false;
        result.events.forEach(({ event: { method, section } }) => {
          if (section === 'system' && method === 'ExtrinsicFailed') {
            extrinsicFailed = true;
            logger.error({
              label,
              message: `Swap failed, block hash ${result.status.asFinalized}`,
            });
          }
        });

        if (!extrinsicFailed) {
          logger.info({
            label,
            message: `Swap success: ${symbol}, block hash ${result.status.asFinalized}`,
          });
        }

        unsub();
      }
    });
  } catch (err) {
    logger.error({ label, message: `Swap tx for ${symbol} failed: ${err}` });
  }
};

export default swap;

const test = async () => {
  const btc: Listing = { category: 'forex', symbol: 'BTCUSD' };

  const api = await ApiPromise.create({
    provider: new WsProvider('wss://node-6632097881473671168.au.onfinality.cloud/ws'),
    types: acalaTypes,
  });
  const priceStr = await fetchPrice(btc);

  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  const account = keyring.addFromUri('0x34ee7beb5884801bcc8e61f80cb5c0cecff356fda8bf159beaf2434b3ffcb982');

  const nonceIndex = await api.query.system.accountNonce(account.address);
  const nonce = nonceIndex.toNumber();

  await swap(api, account, priceStr, btc, nonce);
};

test();
