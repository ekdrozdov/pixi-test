import { getWorld } from '../../main'
import { Disposable } from '../../utils/lifecycle'
import { Movable } from '../agent/animal'
import { Source } from '../agent/objects'
import { Market } from '../market'

export interface GoodsContainer {
  store(good: Good): void
  unstore(good: Good): Good
  has(tag: GoodTag, amount?: number): boolean
}

export class GoodsContainerBase implements GoodsContainer {
  private readonly goods = new Map<GoodTag, { amount: number }>()
  has(tag: GoodTag, amount = 0): boolean {
    const content = this.goods.get(tag)
    if (!content) return false
    return content.amount >= amount
  }
  store(good: Good): void {
    let content = this.goods.get(good.tag)
    if (!content) {
      content = { amount: 0 }
      this.goods.set(good.tag, content)
    }
    content.amount += good.amount
    console.log('=== STORED ===')
    for (const [tag, { amount }] of this.goods.entries()) {
      console.log(`${tag}: ${amount}`)
    }
    console.log('==============')
  }
  unstore(request: Good): Good {
    let stored = this.goods.get(request.tag)
    if (!stored) return { amount: 0, tag: request.tag }
    if (stored.amount < request.amount) {
      const result = { tag: request.tag, amount: stored.amount }
      stored.amount = 0
      return result
    }
    stored.amount -= request.amount
    return request
  }
}

export interface WorkerController extends Movable {
  readonly assets: GoodsContainer
  readonly projects: Partial<Record<GoodTag, number>>
  onFinished(): void
  onStarve(): void
}

export interface Task {
  /**
   * Encapsulates behavior.
   */
  execute(controller: WorkerController): void
  cancel(): void
}

class ReserveTask implements Task {
  constructor(private readonly reserved: Good) {}
  execute(worker: WorkerController): void {
    worker.assets.store(this.reserved)
    worker.onFinished()
  }
  cancel(): void {}
}

export class BuyTask implements Task {
  constructor(private market: Market, good: Good) {}
  execute(worker: WorkerController): void {
    throw new Error()
  }
  cancel(): void {}
}

/**
 * Go to workplace and work for N hours.
 */
export class GenericProductionTask implements Task {
  private timer?: Disposable
  constructor(
    private readonly hoursCost: number,
    private readonly reward: Good,
    private readonly reqs: Good[]
  ) {}
  execute(worker: WorkerController): void {
    this.timer?.dispose()
    // Project not started -> pay setup fee and init time tracker.
    if (worker.projects[this.reward.tag] === undefined) {
      this.reqs.forEach((req) => worker.assets.unstore(req))
      worker.projects[this.reward.tag] = this.hoursCost
    }

    // TODO: get available spots from worker and move to nearest
    const spots = getWorld()
      .scene.all(Source)
      .filter((obj) => obj.tag === this.reward.tag)
    let spot: Source | undefined = undefined
    if (spots.length > 0) {
      spot = spots[Math.floor(Math.random() * spots.length)]
      worker.move(spot.renderable.position!)
    }
    this.timer = getWorld().clock.on('hour', () => {
      spot && worker.move(spot.renderable.position!)
      // TODO: guess better to check it.
      worker.projects[this.reward.tag]!--
      if (worker.projects[this.reward.tag] === 0) {
        worker.projects[this.reward.tag] = undefined
        worker.assets.store(this.reward)
        this.cancel()
        worker.onFinished()
      }
    })
  }
  cancel(): void {
    this.timer?.dispose()
    this.timer = undefined
  }
}

export interface Good {
  tag: GoodTag
  amount: number
}

export interface RecipeModel {
  readonly tag: GoodTag
  readonly manhours: number
  readonly yield: number
  /**
   * Component represents a part of the good, like the tip and shaft of the spear.
   * Outer array is a list of components of the target good.
   * Inner array is a list of suitable materials of a component.
   */
  readonly components?: ReadonlyArray<ReadonlyArray<Good>>
}

export const GOODS = {
  WEAPON: 'WEAPON',
  MEAT: 'MEAT',
  ANIMAL: 'ANIMAL',
  SKIN: 'SKIN',
  TREE: 'TREE',
  HOUSE: 'HOUSE',
  MEAL: 'MEAL',
  HIDE: 'HIDE',
  CLOTH: 'CLOTH',
} as const

export type GoodTag = (typeof GOODS)[keyof typeof GOODS]

// TODO: rm tag duplications
export const RECIPES: Record<GoodTag, RecipeModel> = {
  MEAT: {
    tag: GOODS.MEAT,
    manhours: 2,
    yield: 4,
    components: [[{ tag: GOODS.ANIMAL, amount: 1 }]],
  },
  ANIMAL: {
    tag: GOODS.ANIMAL,
    manhours: 4,
    yield: 1,
  },
  SKIN: {
    tag: GOODS.SKIN,
    manhours: 4,
    yield: 2,
    components: [[{ tag: GOODS.ANIMAL, amount: 1 }]],
  },
  WEAPON: {
    tag: GOODS.WEAPON,
    manhours: 1,
    yield: 1,
  },
  TREE: {
    tag: GOODS.TREE,
    manhours: 24,
    yield: 1,
  },
  HOUSE: {
    tag: GOODS.HOUSE,
    manhours: 400,
    yield: 1,
    components: [[{ tag: GOODS.TREE, amount: 16 }]],
  },
  MEAL: {
    tag: GOODS.MEAL,
    manhours: 1,
    yield: 2,
    components: [[{ tag: GOODS.MEAT, amount: 1 }]],
  },
  HIDE: {
    tag: GOODS.HIDE,
    manhours: 2,
    yield: 1,
    components: [[{ tag: GOODS.SKIN, amount: 1 }]],
  },
  CLOTH: {
    tag: GOODS.CLOTH,
    manhours: 8,
    yield: 1,
    components: [[{ tag: GOODS.HIDE, amount: 2 }]],
  },
} as const
