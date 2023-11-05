/**
 *
 * demands
 *
 * physical
 *  food
 *  cloth
 *  house
 * safety
 *  defense
 *  health
 */

import { GOODS, GoodTag, GoodsContainer } from './goods-production/recieps'

// export const NEEDS = {
//   FOOD: 'FOOD',
//   HOUSE: 'HOUSE',
//   SEX: 'SEX',
//   CLOTH: 'CLOTH',
// } as const

// export type NeedTag = (typeof NEEDS)[keyof typeof NEEDS]

export interface NeedsChain {
  getNeed(): GoodTag | undefined
  reset(): void
}

export interface NeedsSubject {
  readonly inventory: GoodsContainer
  onStarve(): void
}

function getMonthlyFoodAmount(): number {
  // return 2 * 30
  return 10
}

export class NeedsChainBase implements NeedsChain {
  private generator: Generator<GoodTag, void, unknown>
  private foodToEat = getMonthlyFoodAmount()
  constructor(private readonly subj: NeedsSubject) {
    this.generator = this.needsGen()
  }
  getNeed(): GoodTag | undefined {
    const result = this.generator.next().value
    if (!result) return undefined
    return result
  }
  reset() {
    const foodPerMonth = getMonthlyFoodAmount()
    if (this.foodToEat >= foodPerMonth * 0.8) {
      this.subj.onStarve()
    }
    this.foodToEat = foodPerMonth
    this.generator = this.needsGen()
  }
  private *needsGen() {
    const food = this.subj.inventory.unstore({
      tag: 'MEAL',
      amount: this.foodToEat,
    })
    this.foodToEat -= food.amount
    console.log(`food left this monthi: ${this.foodToEat}`)
    while (this.foodToEat > 0) {
      const food = this.subj.inventory.unstore({
        tag: 'MEAL',
        amount: this.foodToEat,
      })
      this.foodToEat -= food.amount
      yield GOODS.MEAL
    }
    if (!this.subj.inventory.has(GOODS.HOUSE)) yield GOODS.HOUSE
    if (!this.subj.inventory.has(GOODS.CLOTH)) yield GOODS.CLOTH
  }
}
