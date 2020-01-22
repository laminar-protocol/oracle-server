import fetch from 'node-fetch';
import { Listing } from './types';

// parse price string from a response
type bodyParser = (body: any) => string | undefined | null;

const getPrice = async (query: string, bodyToPrice: bodyParser): Promise<string> => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
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
const forexBodyParser = (body: any) => body[REALTIME_EX_RATE] && body[REALTIME_EX_RATE][EXCHANGE_RATE_KEY];

const forexPrice = async (from: string, to: string): Promise<string> => {
  const query = `function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}`;
  return getPrice(query, forexBodyParser);
};

const GLOBAL_QUOTE = 'Global Quote';
const CLOSE_PRICE = '05. price';
const stockBodyParser = (body: any) => body[GLOBAL_QUOTE] && body[GLOBAL_QUOTE][CLOSE_PRICE];

const stockPrice = async (symbol: string): Promise<string> => {
  const query = `function=GLOBAL_QUOTE&symbol=${symbol}`;
  return getPrice(query, stockBodyParser);
};

const fetchPrice = (listing: Listing): Promise<string | null> => {
  // TODO: use real price
  if (listing.symbol === 'DOTUSD') {
    return forexPrice('ETH', 'USD');
  }
  if (listing.symbol === 'ACAUSD') {
    return forexPrice('MKR', 'USD');
  }

  if (listing.category === 'forex') {
    const from = listing.symbol.substr(0, 3);
    const to = listing.symbol.substr(3, 3);
    return forexPrice(from, to);
  }

  if (listing.category === 'stock') {
    return stockPrice(listing.symbol);
  }

  return null;
};

export default fetchPrice;
