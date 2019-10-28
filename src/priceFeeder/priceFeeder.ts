import Web3 from 'web3';
import { Account } from 'web3-core';

import fetchPrice from './fetchPrice';
import { AssetPair, AssetPairs } from './types';
import OracleContract from "./oracleContract";

export type PriceFeederConfig = {
  web3Provider: string,
  chain: string,
  ethPrivateKey: string,
  oracleContractAddr: string,
  assetPairs: AssetPairs,
}

export default class PriceFeeder {
  private _web3: Web3;
  private _chain: string;
  private _feederAccount: Account;
  private _oracleContract: OracleContract;
  private _assetPairs: AssetPairs;

  private _continue: boolean;

  constructor(config: PriceFeederConfig) {
    this._web3 = new Web3(config.web3Provider);
    this._chain = config.chain;
    this._feederAccount = this._web3.eth.accounts.privateKeyToAccount(config.ethPrivateKey);
    this._oracleContract = new OracleContract(this._web3, config.oracleContractAddr);
    this._assetPairs = config.assetPairs;
    this._continue = false;
  }

  public start = () => {
    this._continue = true;
    this._poll();
  };

  public stop = () => {
    this._continue = false;
  };

  private _poll = async () => {
    // while(this.continue) {
    for (const assetPair of this._assetPairs) {
      try {
        await this._fetchAndFeedPrice(assetPair);
      } catch (err) {
        // TODO: logger
        console.log(err);
      }
    }
    // }
  };

  private _fetchAndFeedPrice = async (assetPair: AssetPair) => {
    const price = await fetchPrice(assetPair.fromAsset, assetPair.toAsset);
    const callData = this._oracleContract.feedPriceEncoded(price, assetPair.key);

    const tx = {
      from: this._feederAccount.address,
      to: this._oracleContract.addr(),
      data: callData,
      // TODO: set max gas price
      chain: this._chain,
    };
    const { rawTransaction } = await this._feederAccount.signTransaction(tx);
    try {
      const { transactionHash } = await this._web3.eth.sendSignedTransaction(rawTransaction);
      // TODO: logger
      console.log(`Feeding price success with tx hash: ${ transactionHash }`);
    } catch (err) {
      console.log(`Feeding price failed: ${ JSON.stringify(err) }`);
    }
  };
}
