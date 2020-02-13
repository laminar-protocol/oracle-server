export interface Listing {
  symbol: string;
  category: string;
}

export interface FeederKind {
  setup: () => Promise<void>;
  feed: (prices: string[], listings: Listing[]) => Promise<void>;
}

export interface PollKind {
  start: () => void;
  stop: () => void;
  summary: () => any;
}

export type Polls = Map<string, PollKind>;
