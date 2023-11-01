import { Disposable } from '../../utils/lifecycle'
import { GameClock } from '../time'

interface GoodsContainer {
  store(good: Good): void
  unstore(good: Good): Good
}

export class GoodsContainerBase implements GoodsContainer {
  private readonly goods = new Map<GoodTag, { amount: number }>()
  store(good: Good): void {
    let stored = this.goods.get(good.tag)
    if (!stored) {
      stored = { amount: 0 }
      this.goods.set(good.tag, stored)
    }
    stored.amount += good.amount
    for (const [tag, { amount }] of this.goods.entries()) {
      console.log(`${tag}: ${amount}`)
    }
  }
  unstore(request: Good): Good {
    let stored = this.goods.get(request.tag)
    if (!stored) throw new Error('Missing stored')
    if (stored.amount < request.amount) throw new Error('Not sufficient amount')
    stored.amount -= request.amount
    return request
  }
}

export interface Worker {
  readonly inventory: GoodsContainer
  readonly clock: GameClock
  schedule(task: Task): void
  yield(): void
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
      this.worker.schedule(this.task)
    }
  }

  addChild(node: TaskNode) {
    if (!this.children) this.children = []
    this.children.push(node)
  }

  execute(): void {
    this.task.execute({
      inventory: this.worker.inventory,
      clock: this.worker.clock,
      schedule: (task: Task) => {
        this.worker.schedule(task)
      },
      yield: () => {
        if (!this.parent) {
          this.worker.yield()
          return
        }
        if (!this.debt) throw new Error('Missing debt')
        const good = this.worker.inventory.unstore(this.debt)
        if (good.amount < this.debt.amount) throw new Error('Missing goods')
        this.parent.supply(good)
        this.worker.yield()
      },
    })
  }
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
    this.tracker = worker.clock.on('hour', () => {
      --this.hoursLeft
      if (this.hoursLeft === 0) {
        worker.inventory.store(this.reward)
        worker.yield()
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

export function loadTaskTree(recipe: RecipeModel, worker: Worker): TaskNode {
  const reqs = (recipe.components ?? []).map((options) => options[0])
  const children: TaskNode[] = []

  for (const req of reqs) {
    const _recipe = RECIPES[req.tag]
    const reps = Math.ceil(req.amount / _recipe.yield)
    children.push(...Array(reps).map(() => loadTaskTree(_recipe, worker)))
  }
  const task = toTaskNode(recipe, worker, reqs)
  children.forEach((child, i) => {
    task.addChild(child)
    child.parent = task
    child.debt = reqs[i]
  })
  return task
}

function toTaskNode(recipe: RecipeModel, worker: Worker, reqs: Good[]) {
  const task = new GenericProductionTask(recipe.manhours, {
    tag: recipe.tag,
    amount: recipe.yield,
  })
  return new TaskNode(task, worker, reqs)
}

type GoodTag = 'weapon' | 'raw-meat' | 'animal' | 'skin'

export const RECIPES: Record<GoodTag, RecipeModel> = {
  'raw-meat': {
    tag: 'raw-meat',
    manhours: 2,
    yield: 4,
    components: [[{ tag: 'animal', amount: 1 }]] as const,
  },
  animal: {
    tag: 'animal',
    manhours: 4,
    yield: 1,
  },
  skin: {
    tag: 'skin',
    manhours: 4,
    yield: 2,
    components: [[{ tag: 'animal', amount: 1 }]],
  },
  weapon: {
    // TODO
    tag: 'weapon',
    manhours: 1,
    yield: 1,
  },
} as const

/**
 * hide recipe
 *  own a station
 *  own a tool
 *  own a skin
 *  go to the station
 *  work
 */

/**
 * cloth recipe
 *  own a station
 *  own a tool
 *  own a materials
 *    OR hide
 *    OR textile
 *  go to the station
 *  work
 */

/**
 * house recipe
 *  own materials for house kind
 *  go to spot
 *
 */
