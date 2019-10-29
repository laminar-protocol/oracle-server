import Web3 from 'web3';
import { Account } from 'web3-core';

import fetchPrice from './fetchPrice';
import { AssetPair, AssetPairs } from './types';
import OracleContract from "./oracleContract";

export type PriceFeederConfig = {
  web3Provider: string,
  ethPrivateKey: string,
  oracleContractAddr: string,
  assetPairs: AssetPairs,
  gasLimit: number,
}

export default class PriceFeeder {
  private _web3: Web3;
  private _feederAccount: Account;
  private _oracleContract: OracleContract;
  private _assetPairs: AssetPairs;
  private _gasLimit: number;

  private _continue: boolean;

  constructor(config: PriceFeederConfig) {
    this._web3 = new Web3(config.web3Provider);
    this._feederAccount = this._web3.eth.accounts.privateKeyToAccount(config.ethPrivateKey);
    this._oracleContract = new OracleContract(this._web3, config.oracleContractAddr);
    this._assetPairs = config.assetPairs;
    this._gasLimit = config.gasLimit;
    this._continue = false;

    console.log('start with config: ', JSON.stringify(config));
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

  private _fetchAndFeedPrice = async ({ fromAsset, toAsset, keyAddr }: AssetPair) => {
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
      const receipt = await this._web3.eth.sendSignedTransaction(rawTransaction);
      // TODO: logger
      console.log(`Feeding price success: ${ JSON.stringify(receipt) }`);
    } catch (err) {
      console.log(`Feeding price failed: ${ err }`);
    }
  };
}
