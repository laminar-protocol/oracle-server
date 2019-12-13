export interface Listing {
  symbol: string;
  category: string;
}

export interface FeederKind {
  feed: (price: string, listing: Listing) => Promise<void>;
}
