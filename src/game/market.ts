import { getWorld } from '../main'
import {
  buildRequirementsTreeFor,
  estimateBaselineProductionCost as estimateBaseProductionCost,
} from './goods-production/aquisition'
import { Good, GoodTag } from './goods-production/recieps'

// interface Lot {
//   sell(offer: Good, want: GoodTag): void
//   buy(want: Good, offer: GoodTag): void
// }

export interface Market {
  register(): GoodTracker
  getPricesFor(tag: GoodTag): Good[]
}

export class MarketBase implements Market {
  private readonly trackers = new Map<GoodTag, GoodTracker>()
  register(): GoodTracker {
    return {
      sell: (offer: Good, want: GoodTag) => {
        this.getTracker(offer.tag, want).supply(offer.amount)
      },
      buy: (want: Good, offer: GoodTag) => {
        this.getTracker(want.tag, offer).demand(want.amount)
      },
    }
  }
  getPricesFor(tags: GoodTag[]): number[] {
    // this.
    // const prices = this.trackers.get(tag)
    // if (prices)
    //   return Array.from(prices.entries()).map<Good>(([tag, tracker]) => {
    //     return { tag, amount: tracker.getPriceOf(tag) }
    //   })
    // return []
  }

  // TODO: tracker must track the available amount of the good in the market.
  private getTracker(tag: GoodTag): GoodTracker {
    const tracker = this.trackers.get(tag)
    if (tracker) return tracker
    const newTracker = new GoodTrackerBase(tag)
    this.trackers.set(tag, newTracker)
    return newTracker
    // let oneMap = this.trackerMatrix.get(one)
    // let tracker: GoodTracker | undefined = oneMap?.get(another)
    // if (tracker && oneMap) return tracker

    // oneMap = new Map<GoodTag, GoodTracker>()
    // tracker = new GoodTrackerBase(one)
    // this.trackerMatrix.set(one, oneMap)
    // // Maybe already initialized.
    // let anotherMap = this.trackerMatrix.get(another)
    // if (anotherMap === undefined) {
    //   anotherMap = new Map<GoodTag, GoodTracker>()
    //   this.trackerMatrix.set(another, anotherMap)
    // }

    // oneMap.set(another, tracker)
    // anotherMap.set(one, tracker)
    // return tracker
  }
}

interface GoodTracker {
  readonly price: number
  readonly amount: number
  supply(offer: Good, want: GoodTag): void
  demand(want: Good, offer: GoodTag): void
  updatePrice(): void
}

class GoodTrackerBase implements GoodTracker {
  // Represents how many sellees is buyee costs.
  price: number
  amount: number
  private readonly basePrice: number
  private _supply = 0
  private _demand = 0
  constructor(tag: GoodTag) {
    this.basePrice = estimateBaseProductionCost(buildRequirementsTreeFor(tag))
    this.price = this.basePrice
    this.amount = 0
  }
  supply(amount: number): void {
    this._supply += amount
    this.amount += amount
  }
  demand(amount: number): void {
    this._demand += amount
  }
  updatePrice(): void {
    if (this._supply !== 0 && this._demand !== 0) {
      this.price = this.price * (this._demand / this._supply)
    } else {
      this.price = 0
    }
    const minPricePercent = 0.3
    this.price = Math.max(this.price, this.basePrice * minPricePercent)
    this._supply = 0
    this._demand = 0
  }
}
