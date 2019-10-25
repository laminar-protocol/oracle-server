import fetchPrice from './fetchPrice';
import { AssetPairs } from './types';

export default class PriceFeeder {
  private continue: boolean;

  private assetPairs: AssetPairs;

  constructor(assetPairs: AssetPairs) {
    this.assetPairs = assetPairs;
    this.continue = false;
  }

  public start = () => {
    this.continue = true;
    this.poll();
  };

  public stop = () => {
    this.continue = false;
  };

  private poll = async () => {
    // while(this.continue) {
    // TODO: promise all?
    for (const { fromAsset, toAsset } of this.assetPairs) {
      try {
        await this.fetchAndFeedPrice(fromAsset, toAsset);
      } catch (err) {
        console.log(err);
      }
    }
    // }
  };

  private fetchAndFeedPrice = async (fromAsset: string, toAsset: string) => {
    const priceStr = await fetchPrice(fromAsset, toAsset);
    console.log(priceStr);
  };
}
