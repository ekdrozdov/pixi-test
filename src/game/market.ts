import { getWorld } from '../main'
import {
  buildRequirementsTreeFor,
  estimateBaselineProductionCost as estimateBaseProductionCost,
} from './goods-production/aquisition'
import { Good, GoodTag } from './goods-production/recieps'

interface Lot {
  sell(offer: Good, want: GoodTag): void
  buy(want: Good, offer: GoodTag): void
}

export interface Market {
  register(): Lot
  getPricesFor(tag: GoodTag): Good[]
}

export class MarketBase implements Market {
  private readonly prices = new Map<GoodTag, Map<GoodTag, PriceTracker>>()
  register(): Lot {
    return {
      sell: (offer: Good, want: GoodTag) => {
        this.getTracker(offer.tag, want).supply(offer.amount)
      },
      buy: (want: Good, offer: GoodTag) => {
        this.getTracker(want.tag, offer).demand(want.amount)
      },
    }
  }
  getPricesFor(tag: GoodTag): Good[] {
    // Hit stored tag -> just return prices
    const prices = this.prices.get(tag)
    // Not hit stored tag -> prices are stored implicitly, build priceslist.
    if (prices === undefined) return []
    // this.prices
    return []
    throw new Error('Method not implemented.')
  }

  private getTracker(one: GoodTag, another: GoodTag): PriceTracker {
    // Store trackers only for the lowest key.
    const lowest = one < another ? one : another
    const highest = one < another ? another : one
    const priceMap = this.prices.get(lowest)
    if (priceMap === undefined) {
      const map = new Map<GoodTag, PriceTracker>()
      const tracker = new PriceTrackerBase(lowest, highest)
      map.set(highest, tracker)
      this.prices.set(lowest, map)
      return tracker
    }
    const tracker = priceMap.get(highest)
    if (tracker === undefined) {
      const tracker = new PriceTrackerBase(lowest, highest)
      priceMap.set(highest, tracker)
      return tracker
    }
    return tracker
  }
}

interface PriceTracker {
  readonly price: number
  supply(amount: number): void
  demand(amount: number): void
  updatePrice(): void
}

class PriceTrackerBase implements PriceTracker {
  // Represents how many sellees is buyee costs.
  price: number
  private readonly basePrice: number
  private _supply = 0
  private _demand = 0
  constructor(buyee: GoodTag, sellee: GoodTag) {
    const buyeeBaseCost = estimateBaseProductionCost(
      buildRequirementsTreeFor(buyee)
    )
    const selleeBaseCost = estimateBaseProductionCost(
      buildRequirementsTreeFor(sellee)
    )
    this.basePrice = buyeeBaseCost / selleeBaseCost
    this.price = this.basePrice
  }
  supply(amount: number): void {
    this._supply += amount
  }
  demand(amount: number): void {
    this._demand += amount
  }
  updatePrice(): void {
    // TODO: consider division by 0.
    if (this._supply !== 0 && this._demand !== 0) {
      this.price = this.price * (this._demand / this._supply)
    }
    const minPricePercent = 0.3
    this.price = Math.max(this.price, this.basePrice * minPricePercent)
    this._supply = 0
    this._demand = 0
  }
}
