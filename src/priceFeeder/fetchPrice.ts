import fetch from 'node-fetch';

import envVars from '../envVars';

const RES_DATA_KEY = 'Realtime Currency Exchange Rate';
const EXCHANGE_RATE_KEY = '5. Exchange Rate';

const fetchPrice = async (fromAsset: string, toAsset: string): Promise<string> => {
  const apiKey = process.env[envVars.ALPHA_VANTAGE_API_KEY];
  const query = `function=CURRENCY_EXCHANGE_RATE&from_currency=${fromAsset}&to_currency=${toAsset}&apikey=${apiKey}`;
  const res = await fetch(`https://www.alphavantage.co/query?${query}`);

  const resBody = await res.json();
  if (!res.ok || !resBody[RES_DATA_KEY] || !resBody[RES_DATA_KEY][EXCHANGE_RATE_KEY]) {
    throw new Error(`Price fetch failed (${res.status} ${res.statusText}): ${JSON.stringify(resBody)}.`);
  }

  return resBody[RES_DATA_KEY][EXCHANGE_RATE_KEY];
};

export default fetchPrice;
