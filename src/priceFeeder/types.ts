export interface Listing {
  symbol: string;
  category: string;
}

export interface FeederKind {
  setup: () => Promise<void>;
  feed: (price: string, listing: Listing) => Promise<void>;
}
