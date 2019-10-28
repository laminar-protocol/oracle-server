import Web3 from "web3";
import { Account } from "web3-core";

import envVars from '../envVars';
import fetchPrice from './fetchPrice';
import { AssetPair, AssetPairs } from './types';
import OracleContract from "./oracleContract";

export default class PriceFeeder {
  private _web3: Web3;
  private _chain: string;
  private _feederAccount: Account;
  private _oracleContract: OracleContract;
  private _continue: boolean;
  private _assetPairs: AssetPairs;

  constructor(assetPairs: AssetPairs) {
    this._web3 = new Web3(process.env[envVars.WEB3_PROVIDER]);
    this._chain = process.env[envVars.CHAIN];
    this._feederAccount = this._web3.eth.accounts.privateKeyToAccount(process.env[envVars.ETH_PRIVATE_KEY]);
    this._oracleContract = new OracleContract(this._web3, process.env[envVars.ORACLE_CONTRACT_ADDR]);
    this._assetPairs = assetPairs;
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
    const callData = this._oracleContract.feedPriceEncoded(price, assetPair.priceKey);

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
