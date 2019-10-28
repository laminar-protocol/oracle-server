import Web3 from 'web3';
import { Contract } from "web3-eth-contract";
import simplePriceOracleAbi from "flow-protocol/artifacts/abi/SimplePriceOracle.json";
import BN from 'bn.js';

import envVars from "../envVars";

export default class OracleContract {
  private _contract: Contract;
  private _addr: string;

  constructor(web3: Web3, addr: string) {
    this._contract = new web3.eth.Contract(
      simplePriceOracleAbi,
      process.env[envVars.ORACLE_CONTRACT_ADDR],
      { gas: process.env[envVars.GAS_LIMIT] },
    );
  }

  public addr = () => this._addr;

  public feedPriceEncoded = (price: string, priceKey: string): string => {
    const priceBN = new BN(price);
    priceBN.mul(new BN('10e18'));
    return this._contract.methods.feedPrice(priceKey, priceBN).encodeABI();
  }
}
