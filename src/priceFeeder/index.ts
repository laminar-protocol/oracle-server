import deployment from 'flow-protocol/artifacts/deployment.json';

import envVars from '../envVars';
import { AssetPair, AssetPairs } from './types';
import PriceFeeder, { PriceFeederConfig } from './priceFeeder';

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

const DEPLOYED_ORACLE_ADDR_KEY = 'oracle';

const startFeedingPrice = () => {
  const deployed = (deployment as any)[process.env[envVars.CHAIN]];

  const oracleContractAddr = deployed ? deployed[DEPLOYED_ORACLE_ADDR_KEY] : process.env[envVars.LOCAL_TESTNET_ORACLE_CONTRACT_ADDR];
  if (!oracleContractAddr) {
    throw new Error('no oracle contract addr');
  }

  const assetPairs = getAssetPairs([
    {
      fromAsset: 'JPY',
      toAsset: 'USD',
      key: 'fJPY',
    },
    {
      fromAsset: 'EUR',
      toAsset: 'USD',
      key: 'fEUR',
    },
  ], deployed);

  const config: PriceFeederConfig = {
    web3Provider: process.env[envVars.WEB3_PROVIDER],
    ethPrivateKey: process.env[envVars.ETH_PRIVATE_KEY],
    oracleContractAddr,
    assetPairs,
    gasLimit: Number(process.env[envVars.GAS_LIMIT]),
  };
  const priceFeeder = new PriceFeeder(config);
  priceFeeder.start();
};

export default startFeedingPrice;
