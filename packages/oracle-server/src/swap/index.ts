import BN from 'bignumber.js';

import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';

import logger from '../logger';
import { Listing } from '../priceFeeder/types';
import currencyIds from '../priceFeeder/acala/currencyIds.json';

const label = 'Swap';

// if more than `ARBITRAGE_RATIO`, do swap; 2%
const ARBITRAGE_RATIO = new BN('0.02');

// expect less target amount to cover exchange fee (0.3%) and other slippage(0.1%)
const SLIPPAGE_RATIO = new BN('0.996');

const BASE_CURRENCY_ID = 'AUSD';

const SYMBOLS = ['ACAUSD', 'DOTUSD', 'BTCUSD'];

const PRECISION = new BN('1000000000000000000');
const withoutPrecision = (amount: string): string =>
  new BN(amount).div(PRECISION).multipliedBy(10000).integerValue()
    .div(10000)
    .toFixed();

const swapOne = async (api: ApiPromise, account: KeyringPair, priceStr: string, { symbol }: Listing, nonce: number) => {
  if (!SYMBOLS.includes(symbol)) {
    return;
  }

  const price = new BN(priceStr);

  const currencyId = (currencyIds as any)[symbol];
  const pool: any = await api.query.dex.liquidityPool(currencyId);
  const [listingAmount, baseAmount]: [BN, BN] = pool.map((x: any) => new BN(x.toString()));
  if (listingAmount.isZero()) {
    logger.info({ label, message: `No need to swap ${symbol}: zero listing amount.` });
    return;
  }

  const dexPrice = baseAmount.div(listingAmount);

  const gapRatio = price.minus(dexPrice).div(price).abs();
  if (gapRatio.isLessThan(ARBITRAGE_RATIO)) {
    logger.info({ label, message: `No need to swap ${symbol}: price $${priceStr}, dex price $${dexPrice}.` });
    return;
  }
  logger.info({ label, message: `Swap ${symbol}: price $${priceStr}, dex price $${dexPrice}.` });

  const constProduct = listingAmount.multipliedBy(baseAmount);

  const newBaseAmount = constProduct.multipliedBy(price).squareRoot();
  const newListingAmount = constProduct.div(newBaseAmount);

  let tx;
  let swapSummary: string;
  // if dex price is low, buy listing; else sell listing.
  if (dexPrice.isLessThan(price)) {
    const supplyAmount = newBaseAmount.minus(baseAmount).integerValue().toFixed();
    const targetAmount = listingAmount.minus(newListingAmount).multipliedBy(SLIPPAGE_RATIO).integerValue().toFixed();
    tx = api.tx.dex.swapCurrency([BASE_CURRENCY_ID, supplyAmount], [currencyId, targetAmount]);
    swapSummary = `Swap: supply ${withoutPrecision(supplyAmount)} ${BASE_CURRENCY_ID} for ${withoutPrecision(targetAmount)} ${currencyId}`;
  } else {
    const supplyAmount = newListingAmount.minus(listingAmount).integerValue().toFixed();
    const targetAmount = baseAmount.minus(newBaseAmount).multipliedBy(SLIPPAGE_RATIO).integerValue().toFixed();
    tx = api.tx.dex.swapCurrency([currencyId, supplyAmount], [BASE_CURRENCY_ID, targetAmount]);
    swapSummary = `Swap: supply ${withoutPrecision(supplyAmount)} ${currencyId} for ${withoutPrecision(targetAmount)} ${BASE_CURRENCY_ID}`;
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
              message: `${swapSummary} failed, block hash ${result.status.asFinalized}`
            });
          }
        });

        if (!extrinsicFailed) {
          logger.info({
            label,
            message: `${swapSummary} success, block hash ${result.status.asFinalized}`
          });
        }

        unsub();
      }
    });
  } catch (err) {
    logger.error({ label, message: `${swapSummary} failed: ${err}` });
  }
};

const swap = async (api: ApiPromise, account: KeyringPair, priceStrs: string[], listings: Listing[], startingNonce: number): Promise<void> => {
  for (const [i, p] of priceStrs.entries()) {
    const listing = listings[i];
    try {
      await swapOne(api, account, p, listing, startingNonce + i);
    } catch (err) {
      logger.error({ label, message: `Swap ${listing.symbol} failed: ${err}` });
    }
  }
};

export default swap;
