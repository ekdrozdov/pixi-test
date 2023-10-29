type GoodTag = 'weapon' | 'raw-meat' | 'animal' | 'skin'

interface Good {
  readonly tag: GoodTag
  readonly quality: number
}

interface Reward {
  kind: 'reward'
  claim(worker: Worker): void
}

export interface Task {
  kind: 'task'
  execute(): TaskResult
  // createChildren(): void
}

type TaskResult = Reward | Task

/**
 * constructed task tree
 * start execution
 *  schedule leaves (=nodes with no children)
 *  when node's task is done, supply reward to the parent node
 *  when all deps are sullpied, schedule task
 */

class TaskNode implements Task {
  kind: 'task' = 'task'
  children?: TaskNode[]
  // Don't care about actual reward, just count them.
  deps?: number
  parent?: TaskNode
  worker?: Worker
  constructor(private task: Task) {}
  loadSubtree(worker: Worker) {
    if (!this.children) {
      worker.schedule(this)
      return
    }
    this.worker = worker
    this.children.forEach((child) => child.loadSubtree(worker))
  }
  supply(requirement: Reward) {
    if (!this.deps) throw new Error('Unexpected supply')
    this.deps--
    if (this.deps < 0) throw new Error('Deps counter is corrupted')
    if (this.deps === 0) {
      if (!this.worker) throw new Error('Worker is missing')
      this.worker.schedule(this.task)
    }
  }
  addChild(node: TaskNode) {
    node.parent = this
    if (!this.children) this.children = []
    this.children.push(node)
  }
  execute(): TaskResult {
    const result = this.task.execute()
    if (result.kind === 'task') return result
    return this.parent
      ? {
          kind: 'reward',
          claim: () => {
            this.parent?.supply(result)
          },
        }
      : result
  }
}

interface ComponentOptions {
  tag: GoodTag
  amount: number
}

export interface RecipeModel {
  readonly tag: GoodTag
  readonly manhours: number
  readonly yield: number
  /**
   * Component represents a part of the good, like the tip and shaft of the spear.
   * Each part may be produced using any of suitable materials.
   */
  readonly components?: ComponentOptions[][]
  readonly workplace: boolean
  readonly tools: boolean
}

class AnimalRecipe implements RecipeModel {
  tag: GoodTag = 'animal'
  manhours = 4
  yield = 1
  workplace = true
  tools = true
}

class SkinRecipe implements RecipeModel {
  tag: GoodTag = 'skin'
  manhours = 4
  yield = 2
  components: ComponentOptions[][] = [[{ tag: 'animal', amount: 1 }]]
  workplace = false
  tools = true
}

class RawMeatRecipe implements RecipeModel {
  tag: GoodTag = 'raw-meat'
  manhours: number = 2
  yield: number = 4
  components?: ComponentOptions[][] = [[{ tag: 'animal', amount: 1 }]]
  workplace = false
  tools = true
}

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

interface Worker {
  schedule(task: Task): void
}
