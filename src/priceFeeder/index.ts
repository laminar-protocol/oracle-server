import deployment from 'flow-protocol/artifacts/deployment.json';

import envVars from '../envVars';
import logger from '../logger';
import targets from './targets.json';
import PriceFeeder, { PriceFeederConfig } from './priceFeeder';

const getContractAddr = (key: string, deployed: any): string => {
  if (deployed) {
    // deployed asset contract addr
    return deployed[key];
  }

  // local testnet asset contract addr
  const envVarKey = (envVars as any)[key.toUpperCase()];
  if (!envVarKey) {
    throw new Error(`Local test contract address not provided for ${key}`);
  }
  return process.env[envVarKey];
};

const withKeyAddr = (assets: Array<any>, deployed: any) => assets
  // get contract addr
  .map((asset) => ({ ...asset, keyAddr: getContractAddr(asset.key, deployed) }))
  // filter out asset without a contract address
  .filter((asset) => {
    if (!asset.keyAddr) {
      logger.info(`No contract found for ${asset.key}, ignore.`);
    }
    return asset.keyAddr;
  });

const DEPLOYED_ORACLE_ADDR_KEY = 'oracle';

const startFeedingPrice = () => {
  const deployed = (deployment as any)[process.env[envVars.CHAIN]];

  const oracleContractAddr = deployed ? deployed[DEPLOYED_ORACLE_ADDR_KEY] : process.env[envVars.LOCAL_TESTNET_ORACLE_CONTRACT_ADDR];
  if (!oracleContractAddr) {
    throw new Error('no oracle contract addr');
  }

  const assetPairs = withKeyAddr(targets.assetPairs, deployed);
  const stocks = withKeyAddr(targets.stocks, deployed);

  const config: PriceFeederConfig = {
    web3Provider: process.env[envVars.WEB3_PROVIDER],
    ethPrivateKey: process.env[envVars.ETH_PRIVATE_KEY],
    oracleContractAddr,
    assetPairs,
    stocks,
    gasLimit: Number(process.env[envVars.GAS_LIMIT]),
    intervalByMs: Number(process.env[envVars.PRICE_FEED_INTERVAL_MS]),
  };
  const priceFeeder = new PriceFeeder(config);
  priceFeeder.start();
};

export default startFeedingPrice;
