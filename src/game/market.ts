import { getWorld } from '../main'

interface Lot {
  amount: number
  price: number
}

interface Market {
  register(lot: Lot): void
  /**
   * @returns less expensive Lot
   */
  getBest(): Lot | undefined
  buy(lot: Lot, amount: number): void
}

export class MarketBase implements Market {
  lots: Lot[] = []
  constructor() {
    getWorld().clock.on('day', () => {
      console.log(JSON.stringify(this.lots))
    })
  }
  register(lot: Lot): void {
    this.lots.push(lot)
  }
  getBest(): Lot | undefined {
    const nonEmptyLots = this.lots.filter((lot) => lot.amount !== 0)
    if (nonEmptyLots.length === 0) return undefined
    nonEmptyLots.sort((a, b) => a.price - b.price)
    return nonEmptyLots[0]
  }
  buy(lot: Lot, amount: number): void {
    if (amount > lot.amount) throw new Error('Invalid argument')
    lot.amount -= amount
  }
}

const baselineCost = 100
const setupFeeCost = 100

/**
 * I want to buy an N items of X:
 *  find the min price
 *  if min price is less or equal then self-production cost, buy
 */
export class Customer {
  buyDaily = 7
  constructor(market: Market) {
    let purchasesLeft = this.buyDaily
    getWorld().clock.on('tick', () => {
      const lot = market.getBest()
      if (!lot) return
      if (lot.price <= baselineCost + setupFeeCost) {
        const toBuy = Math.min(lot.amount, purchasesLeft)
        market.buy(lot, toBuy)
        purchasesLeft -= toBuy
      }
    })
    getWorld().clock.on('day', () => {
      purchasesLeft = this.buyDaily
    })
  }
}

/**
 * I want to sell an N items of X:
 *  the price is total amount of manhours to produce X
 *  if no goods were sold, decrease price
 *  if sold out, increase price
 */
export class Producer {
  supplyPerDay = 10
  price = baselineCost
  constructor(market: Market) {
    const lot: Lot = { amount: 0, price: baselineCost }
    market.register(lot)
    getWorld().clock.on('day', () => {
      if (lot.amount === 0) {
        this.price += 10
      }
      if (lot.amount > this.supplyPerDay / 2) {
        this.price -= 10
      }
      lot.price = Math.max(this.price, Math.floor(baselineCost * 0.3))
      lot.amount = this.supplyPerDay
    })
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
