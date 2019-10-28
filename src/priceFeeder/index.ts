import deployment from 'flow-protocol/artifacts/deployment.json';

import envVars from '../envVars';
import { AssetPairs } from './types';
import PriceFeeder, { PriceFeederConfig } from './priceFeeder';

const startFeedingPrice = (assetPairs: AssetPairs) => {
  const config: PriceFeederConfig = {
    web3Provider: process.env[envVars.WEB3_PROVIDER],
    chain: process.env[envVars.CHAIN],
    ethPrivateKey: process.env[envVars.ETH_PRIVATE_KEY],
    oracleContractAddr: process.env[envVars.LOCAL_ORACLE_CONTRACT_ADDR],
    assetPairs,
  };
  const priceFeeder = new PriceFeeder(config);
  priceFeeder.start();
};

export default startFeedingPrice;
