import fetch from 'node-fetch';

import envVars from '../envVars';

// parse price string from a response
type bodyParser = (body: any) => string | undefined | null;

const fetchPrice = async (query: string, bodyToPrice: bodyParser): Promise<string> => {
  const apiKey = process.env[envVars.ALPHA_VANTAGE_API_KEY];
  const res = await fetch(`https://www.alphavantage.co/query?${query}&apikey=${apiKey}`);
  const resBody = await res.json();
  const price = bodyToPrice(resBody);
  if (!res.ok || !price) {
    throw new Error(`Price fetch failed (${res.status} ${res.statusText}): ${JSON.stringify(resBody)}.`);
  }
  return price;
};

const REALTIME_EX_RATE = 'Realtime Currency Exchange Rate';
const EXCHANGE_RATE_KEY = '5. Exchange Rate';
const currencyExBodyParser = (body: any) => body[REALTIME_EX_RATE] && body[REALTIME_EX_RATE][EXCHANGE_RATE_KEY];

export const fetchCurrencyExPrice = async (fromAsset: string, toAsset: string): Promise<string> => {
  const query = `function=CURRENCY_EXCHANGE_RATE&from_currency=${fromAsset}&to_currency=${toAsset}`;
  return fetchPrice(query, currencyExBodyParser);
};

const GLOBAL_QUOTE = 'Global Quote';
const CLOSE_PRICE = '05. price';
const stockBodyParser = (body: any) => body[GLOBAL_QUOTE] && body[GLOBAL_QUOTE][CLOSE_PRICE];

export const fetchStockPrice = async (symbol: string): Promise<string> => {
  const query = `function=GLOBAL_QUOTE&symbol=${symbol}`;
  return fetchPrice(query, stockBodyParser);
};
