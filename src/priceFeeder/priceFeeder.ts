import Web3 from 'web3';
import { Account } from 'web3-core';

import logger from '../logger';
import sleep from '../sleep';
import fetchPrice from './fetchPrice';
import { AssetPair, AssetPairs } from './types';
import OracleContract from './oracleContract';

export type PriceFeederConfig = {
  web3Provider: string;
  ethPrivateKey: string;
  oracleContractAddr: string;
  assetPairs: AssetPairs;
  gasLimit: number;
  intervalByMs: number,
};

export default class PriceFeeder {
  private _web3: Web3;
  private _feederAccount: Account;
  private _oracleContract: OracleContract;
  private _assetPairs: AssetPairs;
  private _gasLimit: number;
  private _intervalByMs: number;
  private _continue: boolean;

  constructor(config: PriceFeederConfig) {
    this._web3 = new Web3(config.web3Provider);
    this._feederAccount = this._web3.eth.accounts.privateKeyToAccount(config.ethPrivateKey);
    this._oracleContract = new OracleContract(this._web3, config.oracleContractAddr);
    this._assetPairs = config.assetPairs;
    this._gasLimit = config.gasLimit;
    this._intervalByMs = config.intervalByMs;
    this._continue = false;
  }

  public start = () => {
    logger.info('start feeding price...');
    logger.info('--------------------------');
    const feederInfo = {
      feederAddr: this._feederAccount.address,
      oracleAddr: this._oracleContract.addr(),
      assetPairs: this._assetPairs.map(({ key, keyAddr }) => `${key}: ${keyAddr}`).join(', '),
      gasLimit: this._gasLimit,
    };
    for (const [k, v] of Object.entries(feederInfo)) {
      logger.info(`${k}: ${v}`);
    }
    logger.info('--------------------------');

    this._continue = true;
    this._poll();
  };

  public stop = () => {
    logger.info('stop feeding price...');
    this._continue = false;
  };

  private _poll = async () => {
    while(this._continue) {
      for (const assetPair of this._assetPairs) {
        try {
          await this._fetchAndFeedPrice(assetPair);
        } catch (err) {
          logger.error(`${err}`);
        }
      }
      
      await sleep(this._intervalByMs);
    }
  };

  private _fetchAndFeedPrice = async ({ fromAsset, toAsset, key, keyAddr }: AssetPair) => {
    const price = await fetchPrice(fromAsset, toAsset);
    const callData = this._oracleContract.feedPriceEncoded(price, keyAddr);
    const nonce = await this._web3.eth.getTransactionCount(this._feederAccount.address);

    const tx = {
      from: this._feederAccount.address,
      to: this._oracleContract.addr(),
      nonce,
      data: callData,
      gas: this._gasLimit,
    };
    const { rawTransaction } = await this._feederAccount.signTransaction(tx);
    try {
      const { transactionHash } = await this._web3.eth.sendSignedTransaction(rawTransaction);
      // TODO: logger
      logger.info(`Feeding '${key}' price success, price ${price}, tx hash ${transactionHash}.`);
    } catch (err) {
      logger.error(`Feeding '${key}' price failed: ${err}.`);
    }
  };
}
