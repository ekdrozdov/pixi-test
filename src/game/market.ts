import { getWorld } from '../main'
import { Good, GoodTag } from './goods-production/recieps'

interface Lot {
  sell(offer: Good, want: GoodTag): void
  buy(want: Good, offer: GoodTag): void
}

export interface Market {
  register(): Lot
  getPricesFor(good: GoodTag): Good[]
}

class MarketBase implements Market {
  prices = new Map<GoodTag, PriceTracker[]>()
  register(): Lot {
    return {
      sell: (offer: Good, want: GoodTag) => {},
      buy: (want: Good, offer: GoodTag) => {},
    }
  }
  getPricesFor(good: GoodTag): Good[] {
    throw new Error('Method not implemented.')
  }
}

interface PriceTracker {
  readonly price: number
  supply(amount: number): void
  demand(amount: number): void
  reset(): void
}

class PriceTrackerBase {
  constructor(lhs: GoodTag, rhs: GoodTag) {
    // find labor costs -> baseline costs
  }
}

/**
 * Price inflate
 *  demand is more than supply
 * Price deflation
 *  demand is less than supply
 * Production up
 *  product price is more than baseline
 * Production down
 *  product price is less than baseline
 */

export class DumbMarket {
  basePrice = 100
  price = 100
  demandCount = 1
  supplyCount = 1
  cries = 0
  constructor() {
    getWorld().clock.on('day', () => {
      this.price = Math.max(
        Math.floor(this.basePrice * (this.demandCount / this.supplyCount)),
        Math.floor(this.basePrice * 0.2)
      )
      console.log(`price: ${this.price}, potential: ${this.cries}`)
      this.demandCount = 0
      this.supplyCount = 0
      this.cries = 0
    })
  }
  supply(amount: number): void {
    this.supplyCount += amount
  }
  demand(amount: number) {
    this.demandCount += amount
  }
  cry(amount: number) {
    this.cries += amount
  }
}

export class DumbCustomer {
  constructor(market: DumbMarket, budgetPerItem: number, toBuy: number) {
    getWorld().clock.on('day', () => {
      if (market.price <= budgetPerItem) {
        market.demand(toBuy)
      } else {
        market.cry(toBuy)
      }
    })
  }
}

export class DumbProducer {
  constructor(market: DumbMarket, toSell: number) {
    getWorld().clock.on('day', () => {
      market.supply(toSell)
    })
  }
}
