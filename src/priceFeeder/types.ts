export type AssetPair = { fromAsset: string; toAsset: string; key: string; keyAddr?: string };
export type AssetPairs = Array<AssetPair>;

// stocks with string symbol
export type Stock = { symbol: string; key: string; keyAddr?: string };
export type Stocks = Array<Stock>;

export type Assets = AssetPair | Stock;
