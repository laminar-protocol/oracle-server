import Web3 from 'web3';
import * as web3Utils from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import simplePriceOracleAbi from 'flow-protocol/artifacts/abi/SimplePriceOracle.json';

export default class OracleContract {
  private _contract: Contract;
  private _addr: string;

  constructor(web3: Web3, addr: string) {
    this._contract = new web3.eth.Contract(simplePriceOracleAbi, addr);
    this._addr = addr;
  }

  public addr = () => this._addr;

  public feedPriceEncoded = (price: string, priceKey: string): string => {
    // big number doesn't work, use hex instead
    const priceHex = web3Utils.toHex(web3Utils.toWei(price));
    return this._contract.methods.feedPrice(priceKey, priceHex).encodeABI();
  }
}
