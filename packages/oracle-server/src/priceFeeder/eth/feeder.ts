import Web3 from 'web3';
import { Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import * as web3Utils from 'web3-utils';

import kovanDeployment from 'flow-protocol/artifacts/kovan/deployment.json';
import kovanSimplePriceOracleAbi from 'flow-protocol/artifacts/kovan/abi/SimplePriceOracle.json';

import logger from '../../logger';
import { FeederKind, Listing } from '../types';
import symbolKeys from './symbolKeys.json';

/**
 * Query a deployed address of a given key.
 * @param key key of flow-protocl artifacts `deployement.json`, for instance `oracle`, `fEUR`.
 */
const deployedAddrs = (key: string): string | null => {
  if (process.env.CHAIN === 'kovan') {
    return (kovanDeployment as any)?.[key];
  }
  return null;
};

const addrOfSymbol = (symbol: string): string => {
  const key: string = (symbolKeys as any)[symbol];
  if (process.env.LOCAL === 'true') {
    return process.env[key.toUpperCase()];
  }

  return deployedAddrs(key);
};

const withGasPrice = (tx: object): object => {
  if (process.env.CHAIN === 'mainnet') {
    // TODO: get mainnet gas price from gas station.
    return tx;
  }
  // 1 gwei for testnet
  return { ...tx, gasPrice: web3Utils.toWei('1', 'gwei') };
};

const label = 'EthFeeder';

/**
 * Feed price data to ETH oracle contract.
 */
export class EthFeeder implements FeederKind {
  private web3: Web3;
  private account: Account;
  private oracle: Contract;
  private oracleAddr: string;
  private gasLimit: number;

  constructor(web3Provider: string, privateKey: string, oracleAddr: string, gasLimit: number) {
    this.web3 = new Web3(web3Provider);
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.oracle = new this.web3.eth.Contract(kovanSimplePriceOracleAbi as web3Utils.AbiItem[], oracleAddr);
    this.oracleAddr = oracleAddr;
    this.gasLimit = gasLimit;
  }

  public setup = async (): Promise<void> => Promise.resolve();

  private feedOne = async (price: string, { symbol }: Listing, nonce: number) => {
    const tx = withGasPrice({
      from: this.account.address,
      to: this.oracleAddr,
      nonce,
      data: this.encodeCalldata(price, addrOfSymbol(symbol)),
      gas: this.gasLimit
    });
    const { rawTransaction } = await this.account.signTransaction(tx);

    try {
      const { transactionHash } = await this.web3.eth.sendSignedTransaction(rawTransaction);
      logger.info({ label, message: `Tx successful '${symbol}': price ${price}, hash ${transactionHash}.` });
    } catch (err) {
      logger.error({ label, message: `Tx failed '${symbol}': ${err}.` });
    }
  };

  public feed = async (prices: string[], listings: Listing[]): Promise<void> => {
    let nonce: number;
    try {
      nonce = await this.web3.eth.getTransactionCount(this.account.address);
    } catch (err) {
      logger.error({ label, message: `Getting nonce failed: ${err}.` });
      return;
    }

    await Promise.all(
      prices.map((price, i) => {
        const listing = listings[i];
        return this.feedOne(price, listing, nonce + i);
      })
    );
  }

  private encodeCalldata = (price: string, keyAddr: string): string => {
    // big number doesn't work, use hex instead
    const priceHex = web3Utils.toHex(web3Utils.toWei(price));
    return this.oracle.methods.feedPrice(keyAddr, priceHex).encodeABI();
  };
}

const ORACLE_KEY = 'oracle';

const getOracleAddr = (): string => {
  if (process.env.LOCAL === 'true') {
    return process.env.LOCAL_TESTNET_ORACLE_CONTRACT_ADDR;
  }

  return deployedAddrs(ORACLE_KEY);
};

export const newEthFeeder = (): EthFeeder => {
  const oracleAddr = getOracleAddr();
  if (!oracleAddr) {
    throw new Error('No oracle address.');
  }

  return new EthFeeder(
    process.env.WEB3_PROVIDER,
    process.env.ETH_PRIVATE_KEY,
    oracleAddr,
    Number(process.env.GAS_LIMIT)
  );
};
