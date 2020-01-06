export interface Listing {
  symbol: string;
  category: string;
}

export interface FeederKind {
  setup: () => Promise<void>;
  nonce: () => Promise<number>;
  feed: (price: string, listing: Listing, nonce: number) => Promise<void>;
}
