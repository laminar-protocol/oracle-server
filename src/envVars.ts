import { config as dotenvConfig } from 'dotenv';

const META_VARS = {
  // use `.env` to load env vars by default, unless set as `false`
  DOTENV: 'DOTENV',
};

const REQUIRED_VARS = {
  ALPHA_VANTAGE_API_KEY: 'ALPHA_VANTAGE_API_KEY',
  PRICE_FEED_INTERVAL_MS: 'PRICE_FEED_INTERVAL_MS', // by milliseconds

  WEB3_PROVIDER: 'WEB3_PROVIDER',
  ETH_PRIVATE_KEY: 'ETH_PRIVATE_KEY',
  CHAIN: 'CHAIN',
  GAS_LIMIT: 'GAS_LIMIT',
};

const LOCAL_TESTNET_VARS = {
  CONSOLE_LOG: 'CONSOLE_LOG', // 'true' or 'false'

  LOCAL_TESTNET_ORACLE_CONTRACT_ADDR: 'LOCAL_TESTNET_ORACLE_CONTRACT_ADDR',
  FJPY: 'LOCAL_TESTNET_FJPY_ADDR',
  FEUR: 'LOCAL_TESTNET_FEUR_ADDR',
};

const VARS = { ...META_VARS, ...REQUIRED_VARS, ...LOCAL_TESTNET_VARS };

const configVars = () => {
  // init dotenv if needed
  if (process.env[VARS.DOTENV] !== 'false') {
    const result = dotenvConfig();
    if (result.error) {
      throw result.error;
    }
  }

  // check required vars
  Object.values(REQUIRED_VARS).forEach((varKey: string) => {
    const variable = process.env[varKey];
    if (variable === undefined) {
      throw new Error(`no ${varKey} environment variable`);
    }
  });
};

configVars();

export default VARS;
