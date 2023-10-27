import { EventEmitter, EventEmitterBase } from '../../utils/events'

type ConditionEvents = {
  ready: void
}

export interface _Condition extends EventEmitter<ConditionEvents> {
  addChild(condition: _Condition): void
  estimate(subject: ConditionSubject): number
  execute(subject: ConditionSubject): Promise<void>
}

export class ConditionComposite
  extends EventEmitterBase<ConditionEvents>
  implements _Condition
{
  private readonly _children: _Condition[] = []
  addChild(condition: _Condition): void {
    this._children.push(condition)
  }
  estimate(subject: ConditionSubject): number {
    throw new Error('Method not implemented.')
  }
  async execute(subject: ConditionSubject): Promise<void> {
    await Promise.all(this._children.map((child) => child.execute(subject)))
    return
  }
  static and(...conditions: _Condition[]): _Condition {
    const composite = new ConditionComposite()
    conditions.forEach((condition) => composite.addChild(composite))
    return composite
  }
}

export class Owns<T extends GoodTag>
  extends ConditionComposite
  implements _Condition
{
  private readonly _tag: GoodTag
  constructor(tag: T) {
    super()
    this._tag = tag
  }
  override async execute(subject: ConditionSubject): Promise<void> {
    await super.execute(subject)
    if (subject.goods().some((good) => good.tag === this._tag)) {
      return
    }
    return subject.order(this._tag)
  }
}

export interface Recipe {
  readonly condition: Condition
  readonly manhours: number
}

type GoodTag = 'weapon' | 'raw-meat'

interface Good {
  readonly tag: GoodTag
  readonly value: number
  readonly quality: number
}

interface Order {}

interface ConditionSubject {
  goods(): Good[]
  order(tag: GoodTag): Promise<void>
}

type LocationTag = 'hunting'

class Condition {
  static and(...conditions: Condition[]): Condition {
    throw new Error('Method not implemented.')
  }
  static then(condition: Condition): Condition {
    throw new Error('Method not implemented.')
  }
  static owns(tag: GoodTag): Condition {
    throw new Error('Method not implemented.')
  }
  static at(location: LocationTag): Condition {
    throw new Error('Method not implemented.')
  }
  // and(...conditions: Condition[]): Condition {
  //   throw new Error('Method not implemented.')
  // }
  then(condition: Condition): Condition {
    throw new Error('Method not implemented.')
  }
  async execute(subject: ConditionSubject): Promise<void> {}
  // owns(tag: GoodTag): Condition {
  //   throw new Error('Method not implemented.')
  // }
  // at(location: LocationTag): Condition {
  //   throw new Error('Method not implemented.')
  // }
}

class Good {
  constructor(public readonly tag: GoodTag, public amount: number) {}
}

class RawMeatRecipe implements Recipe {
  condition = Condition.owns('weapon').then(Condition.at('hunting'))
  manhours = 2
  async execute(subject: ConditionSubject): Promise<Good> {
    await this.condition.execute(subject)
    // should be scheduled for working hours
    // go to location
    // spend time
    // get reward
    return new Good('raw-meat', 1)
  }
}

/**
 * const order = getBestOrder(orderPool)
 * agent.shedule(order.recipe.steps)
 *
 * const agent
 * const hunting
 *
 * agent executor:
 * if working time
 *  get task from queue
 *  try to execute
 *  task is complete -> save result and poll
 *  task is not complete -> save progress and put it to the task queue
 *
 * one task upon completion may generate other task
 * OR when a set of tasks completed, it may schedule another task
 * or maybe just add a conditions for the tasks?
 * or maybe add a pending tasks, whenever a task is done, check pending (a-la 'depending' or 'blocked')
 */

interface Reward {}

export interface Task {
  execute(): Task | Reward
  createChildren(): void
}

class TaskC implements Task {
  private reqs: Task[] = []
  constructor(private worker: Worker, private children: Task[]) {}
  supply(req: Task) {
    this.reqs.push(req)
    this.worker.schedule(this)
  }
  execute(): Task | Reward {
    throw new Error('Method not implemented.')
  }
  createChildren() {
    this.children.forEach((child) => child.createChildren())
  }
}

class RecipeNode {
  private deps: RecipeNode[]
  private task: Task
  private reqs: RecipeNode[] = []
  init(worker: Worker) {
    this.deps.forEach((d) => d.init(worker))
    if (this.reqs.length === 0) {
      worker.schedule(this.task)
    }
  }
}

class Recipe2 {}

interface Worker {
  schedule(task: Task): void
}

class AquireWeapon implements Task {}

class Hunt implements Task {
  start(): Task {
    // aquire weapon, add pending task
    // then go to hunter spot, then spend hour, then spend hour
  }
}