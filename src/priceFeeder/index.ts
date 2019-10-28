import deployment from 'flow-protocol/artifacts/deployment.json';

import envVars from '../envVars';
import { AssetPair, AssetPairs } from './types';
import PriceFeeder, { PriceFeederConfig } from './priceFeeder';

const DEPLOYED_ORACLE_ADDR_KEY = 'oracle';

const startFeedingPrice = () => {
  const chain = process.env[envVars.CHAIN];
  const deployed = (deployment as any)[chain];

  const oracleContractAddr = deployed
    ? deployed[DEPLOYED_ORACLE_ADDR_KEY]
    : process.env[envVars.LOCAL_TESTNET_ORACLE_CONTRACT_ADDR];
  if (!oracleContractAddr) {
    throw new Error('no oracle contract addr');
  }

  const assetPairs = [
    {
      fromAsset: 'JPY',
      toAsset: 'USD',
      key: 'fJPY',
    },
    {
      fromAsset: 'EUR',
      toAsset: 'USD',
      key: 'fEUR',
    }
  ];
  const config: PriceFeederConfig = {
    web3Provider: process.env[envVars.WEB3_PROVIDER],
    chain,
    ethPrivateKey: process.env[envVars.ETH_PRIVATE_KEY],
    oracleContractAddr: process.env[envVars.LOCAL_TESTNET_ORACLE_CONTRACT_ADDR],
    assetPairs: getAssetPairs(assetPairs, deployed),
    gasLimit: Number(process.env[envVars.GAS_LIMIT]),
  };

  const priceFeeder = new PriceFeeder(config);
  priceFeeder.start();
};

const getAssetPairs = (assetPairs: AssetPairs, deployed: any): AssetPairs =>
  assetPairs.map((assetPair: AssetPair) => {
    const { key } = assetPair;
    let keyAddr: string;
    if (deployed) {
      // deployed asset contract addr
      keyAddr = deployed[key];
    } else {
      // local testnet asset contract addr
      const envVarKey = (envVars as any)[key.toUpperCase()];
      if (!envVarKey) {
        throw new Error(`Local test contract address not provided for ${key}`);
      }
      keyAddr = process.env[envVarKey];
    }
    return { ...assetPair, keyAddr };
  });

export default startFeedingPrice;
