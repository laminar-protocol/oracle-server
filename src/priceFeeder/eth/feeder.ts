import Web3 from 'web3';
import { Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import * as web3Utils from 'web3-utils';

import deployment from 'flow-protocol/artifacts/deployment.json';
import simplePriceOracleAbi from 'flow-protocol/artifacts/abi/SimplePriceOracle.json';

import logger from '../../logger';
import { FeederKind, Listing } from '../types';
import symbolKeys from './symbolKeys.json';

const addrOfSymbol = (symbol: string): string => {
  const key: string = (symbolKeys as any)[symbol];
  if (process.env.LOCAL === 'true') {
    return process.env[key.toUpperCase()];
  }

  const deployed = (deployment as any)[process.env.CHAIN];
  return deployed && deployed[key];
};

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
    this.oracle = new this.web3.eth.Contract(simplePriceOracleAbi, oracleAddr);
    this.oracleAddr = oracleAddr;
    this.gasLimit = gasLimit;
  }

  public feed = async (price: string, { symbol }: Listing) => {
    const nonce = await this.web3.eth.getTransactionCount(this.account.address);
    const tx = {
      from: this.account.address,
      to: this.oracleAddr,
      nonce,
      data: this.encodeCalldata(price, addrOfSymbol(symbol)),
      gas: this.gasLimit,
    };
    const { rawTransaction } = await this.account.signTransaction(tx);

    try {
      const { transactionHash } = await this.web3.eth.sendSignedTransaction(rawTransaction);
      logger.info(`Feeding '${symbol}' price success, price ${price}, tx hash ${transactionHash}.`);
    } catch (err) {
      logger.error(`Feeding '${symbol}' price failed: ${err}.`);
    }
  }

  private encodeCalldata = (price: string, keyAddr: string): string => {
    // big number doesn't work, use hex instead
    const priceHex = web3Utils.toHex(web3Utils.toWei(price));
    return this.oracle.methods.feedPrice(keyAddr, priceHex).encodeABI();
  };
}

const getOracleAddr = (): string => {
  if (process.env.LOCAL === 'true') {
    return process.env.LOCAL_TESTNET_ORACLE_CONTRACT_ADDR;
  }

  const deployed = (deployment as any)[process.env.CHAIN];
  return deployed && deployed.oracle;
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
    Number(process.env.GAS_LIMIT),
  );
};
