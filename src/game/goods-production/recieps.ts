import { getWorld } from '../../main'
import { Disposable } from '../../utils/lifecycle'
import { Movable, Source } from '../agent'

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
    // console.log('=== STORED ===')
    for (const [tag, { amount }] of this.goods.entries()) {
      // console.log(`${tag}: ${amount}`)
    }
    // console.log('==============')
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

export interface Worker extends Movable {
  readonly inventory: GoodsContainer
  schedule(task: Task): void
  onFinished(): void
}

export interface Task {
  /**
   * Encapsulates behavior.
   */
  execute(worker: Worker): void
  pause(): void
}

class TaskNode implements Task {
  private children?: TaskNode[]
  parent?: TaskNode
  debt?: Good
  constructor(
    private readonly task: Task,
    private readonly worker: Worker,
    private readonly reqs: Good[]
  ) {}

  schedule(worker: Worker) {
    if (!this.children) {
      worker.schedule(this)
      return
    }
    this.children.forEach((child) => child.schedule(worker))
  }

  pause(): void {
    this.task.pause()
  }

  supply(good: Good) {
    this.reqs.splice(0, 1)
    if (this.reqs.length === 0) {
      this.worker.schedule(this)
    }
  }

  addChild(node: TaskNode) {
    if (!this.children) this.children = []
    this.children.push(node)
  }

  execute(): void {
    this.task.execute({
      inventory: this.worker.inventory,
      move: (point) => this.worker.move(point),
      hold: (point) => this.worker.hold(point),
      stop: () => this.worker.stop(),
      schedule: (task: Task) => this.worker.schedule(task),
      onFinished: () => {
        if (!this.parent) {
          this.worker.onFinished()
          return
        }
        if (!this.debt) throw new Error('Missing debt')
        const good = this.worker.inventory.unstore(this.debt)
        if (good.amount < this.debt.amount) throw new Error('Missing goods')
        this.parent.supply(good)
        this.worker.onFinished()
      },
    })
  }
}

class ReserveTask implements Task {
  constructor(private readonly reserved: Good) {}
  execute(worker: Worker): void {
    worker.inventory.store(this.reserved)
    worker.onFinished()
  }
  pause(): void {}
}

/**
 * Go to workplace and work for N hours.
 */
class GenericProductionTask implements Task {
  tracker?: Disposable
  constructor(private hoursLeft: number, private reward: Good) {
    if (this.hoursLeft <= 0) throw new RangeError()
  }
  execute(worker: Worker): void {
    this.tracker?.dispose()
    // TODO: rm clock from worker
    // TODO: get available spots from worker and move to nearest
    const spots = getWorld()
      .scene.all(Source)
      .filter((obj) => obj.tag === this.reward.tag)
    let spot: Source | undefined = undefined
    if (spots.length > 0) {
      spot = spots[Math.floor(Math.random() * spots.length)]
      worker.move(spot.renderable.position!)
    }
    this.tracker = getWorld().clock.on('hour', () => {
      spot && worker.move(spot.renderable.position!)
      --this.hoursLeft
      if (this.hoursLeft === 0) {
        worker.inventory.store(this.reward)
        this.pause()
        worker.onFinished()
      }
    })
  }
  pause(): void {
    this.tracker?.dispose()
    this.tracker = undefined
  }
}

interface Good {
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

export function createProdTaskTree(
  recipe: RecipeModel,
  worker: Worker
): TaskNode {
  const reqs = (recipe.components ?? []).map((options) => options[0])
  const children: TaskNode[] = []

  for (const req of reqs) {
    const _recipe = RECIPES[req.tag]
    let debtAmount = req.amount
    while (debtAmount > 0) {
      let task: TaskNode
      // Worker already has a good -> reserve it.
      if (worker.inventory.has(_recipe.tag, debtAmount)) {
        const reserved = worker.inventory.unstore({
          tag: _recipe.tag,
          amount: debtAmount,
        })
        task = new TaskNode(new ReserveTask(reserved), worker, [])
        task.debt = reserved
        debtAmount = 0
      }
      // Otherwise, produce it.
      else {
        task = createProdTaskTree(_recipe, worker)
        const _debt = Math.min(debtAmount, _recipe.yield)
        task.debt = { tag: _recipe.tag, amount: _debt }
        debtAmount -= _debt
      }
      children.push(task)
    }
    // const reps = Math.ceil(req.amount / _recipe.yield)
    // children.push(
    //   ...Array.from(Array(reps)).map(() => {
    //     if (worker.inventory.has(_recipe.tag, req.amount)) {
    //       const reserved = worker.inventory.unstore({
    //         tag: _recipe.tag,
    //         amount: req.amount,
    //       })
    //       const task = new TaskNode(new ReserveTask(reserved), worker, [])
    //       task.debt = reserved
    //       return task
    //     }
    //     const task = createProdTaskTree(_recipe, worker)
    //     // task.debt =
    //     return task
    //   })
    // )
  }
  const task = createProdTaskNode(recipe, worker, reqs)
  children.forEach((child, i) => {
    task.addChild(child)
    child.parent = task
  })
  return task
}

function createProdTaskNode(recipe: RecipeModel, worker: Worker, reqs: Good[]) {
  const task = new GenericProductionTask(recipe.manhours, {
    tag: GOODS[recipe.tag],
    amount: recipe.yield,
  })
  return new TaskNode(task, worker, reqs)
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

// export const NEED_TO_GOODS: Record<NeedTag, ReadonlyArray<GoodTag>> = {
//   [NEEDS.FOOD]: [GOODS.MEAL],
//   [NEEDS.CLOTH]: [GOODS.CLOTH],
//   [NEEDS.HOUSE]: [GOODS.HOUSE],
//   [NEEDS.SEX]: [],
// } as const

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
    manhours: 4,
    yield: 1,
  },
  HOUSE: {
    tag: GOODS.HOUSE,
    manhours: 16,
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
