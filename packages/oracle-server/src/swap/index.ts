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

const swapOne = async (api: ApiPromise, account: KeyringPair, priceStr: string, { symbol }: Listing, nonce: number, tip: number): Promise<boolean> => {
  if (!SYMBOLS.includes(symbol)) {
    return;
  }

  const price = new BN(priceStr);

  const currencyId = (currencyIds as any)[symbol];
  const pool: any = await api.query.dex.liquidityPool(currencyId);
  const [listingAmount, baseAmount]: [BN, BN] = pool.map((x: any) => new BN(x.toString()));
  if (listingAmount.isZero()) {
    logger.debug({ label, message: `No need to swap ${symbol}: zero listing amount.` });
    return false;
  }

  const dexPrice = baseAmount.div(listingAmount);

  const gapRatio = price.minus(dexPrice).div(price).abs();
  if (gapRatio.isLessThan(ARBITRAGE_RATIO)) {
    logger.debug({ label, message: `No need to swap ${symbol}: price $${priceStr}, dex price $${dexPrice}.` });
    return false;
  }
  logger.info({ label, message: `Swap ${symbol}: price $${priceStr}, dex price $${dexPrice}.` });

  const constProduct = listingAmount.multipliedBy(baseAmount);

  const newBaseAmount = constProduct.multipliedBy(price).squareRoot();
  const newListingAmount = constProduct.div(newBaseAmount);

  let tx: any;
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
  logger.info({ label, message: `Sending: ${swapSummary} nonce: ${nonce}` });
  try {
    const unsub = await tx.signAndSend(account, { nonce, tip }, (result: SubmittableResult) => {
      if (result.isCompleted) {
        let extrinsicFailed = result.isError;
        if (result.isInBlock) {
          result.events.forEach(({ event: { method, section } }) => {
            if (section === 'system' && method === 'ExtrinsicFailed') {
              extrinsicFailed = true;
            }
          });
        }

        if (extrinsicFailed) {
          logger.error({
            label,
            message: `Failed: ${swapSummary}, block hash ${result.isInBlock ? result.status.asInBlock : '-'}, tx hash ${tx.hash}, result: ${JSON.stringify(result.toHuman())}`
          });
        } else {
          logger.info({
            label,
            message: `Success: ${swapSummary}, block hash ${result.isInBlock ? result.status.asInBlock : '-'}, tx hash ${tx.hash}`
          });
        }

        unsub();
      }
    });
  } catch (err) {
    logger.error({ label, message: `Failed: ${swapSummary}: ${err} tip: ${tip}` });
    return false;
  }

  return true;
};

const swap = async (api: ApiPromise, account: KeyringPair, priceStrs: string[], listings: Listing[], startingNonce: number, tip: number): Promise<void> => {
  let nonce = startingNonce;
  for (const [i, p] of priceStrs.entries()) {
    const listing = listings[i];
    try {
      const sent = await swapOne(api, account, p, listing, nonce, tip);
      if (sent) {
        nonce += 1;
      }
    } catch (err) {
      logger.error({ label, message: `Swap ${listing.symbol} failed: ${err}` });
    }
  }
};

export default swap;
