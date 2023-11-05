import { crop } from '../utils/math'
import { Point } from '../renderer/renderable'
import { SceneObject, SceneObjectBase } from './scene'
import { World } from './world'
import {
  GOODS,
  GoodTag,
  GoodsContainer,
  GoodsContainerBase,
  RECIPES,
  Task,
  Worker,
  loadTaskTree,
} from './goods-production/recieps'
import { NeedsChain, NeedsChainBase, NeedsSubject } from './demands'

export class Tree extends SceneObjectBase {
  constructor() {
    super()
    this.renderable.kind = 'tree'
  }
}

export class Source extends SceneObjectBase {
  constructor(public tag: GoodTag) {
    super()
  }
}

export class TreeSource extends Source {
  constructor() {
    super(GOODS.TREE)
    this.renderable.kind = 'tree-source'
  }
}

export class AnimalSource extends Source {
  constructor() {
    super(GOODS.ANIMAL)
    this.renderable.kind = 'animal-source'
  }
}

type BiologicalState = 'idle' | 'sleeping' | 'moving' | 'eating' | 'holding'

export interface BiologicalModel {
  health: number
  state: BiologicalState
  readonly age: number
  readonly isAlive: boolean
}

export interface Biological extends BiologicalModel {
  die(): void
}

export interface AnimalModel extends BiologicalModel {
  readonly speed: number
}

export interface Movable {
  move(point: Point): void
  hold(point: Point): void
  stop(): void
}

export interface Animal extends SceneObject, Biological, AnimalModel, Movable {
  sleep(): void
}

export class BiologicalBase extends SceneObjectBase implements Biological {
  health: number
  age: number = 0
  isAlive = true
  state: BiologicalState = 'idle'
  private _hours = 0
  protected _world!: World
  private _dissipationHoursLeft = 10
  constructor(model?: Partial<BiologicalModel>) {
    super()
    this.health = model?.health ?? 100
    this.age = model?.age ?? 0
  }
  die(): void {
    this.isAlive = false
    this.renderable.state = 'dead'
  }
  override onMount(world: World): void {
    this._world = world
    super.onMount(world)
    this.register(
      world.clock.on('hour', () => {
        if (!this.isAlive) {
          if (--this._dissipationHoursLeft === 0) {
            this._world.scene.dismount(this)
          }
        }
        this._hours++
        if (this._hours % 8_760 === 0) this.age++
      })
    )
  }
}

export class AnimalAgentBase
  extends BiologicalBase
  implements Animal, NeedsSubject
{
  object: SceneObject
  speed: number
  private _moveTarget?: Point
  private needsCentricTasks = new Map<GoodTag, Task[]>()
  private needs: NeedsChain = new NeedsChainBase(this)
  inventory: GoodsContainer = new GoodsContainerBase()

  constructor(model?: Partial<AnimalModel>) {
    super(model)
    this.object = new SceneObjectBase()
    this.speed = model?.speed ?? 5
  }

  onStarve(): void {
    this.die()
  }

  sleep(): void {
    this.state = 'sleeping'
  }

  move(point: Point): void {
    this._moveTarget = point
    this.state = 'moving'
  }

  hold(point: Point): void {
    this.state = 'holding'
  }

  stop(): void {
    this.state = 'idle'
  }

  private activeTask?: Task

  override onMount(world: World): void {
    super.onMount(world)
    // movement executor
    this.register(
      world.clock.on('tick', () => {
        if (!this._moveTarget) return
        if (!this.isAlive) return
        const { position } = this.renderable
        if (!position) return
        const dx = crop(this._moveTarget.x - position.x, this.speed)
        const dy = crop(this._moveTarget.y - position.y, this.speed)
        position.x = position.x + dx
        position.y = position.y + dy
        if (
          position.x === this._moveTarget.x &&
          position.y === this._moveTarget.y
        )
          this.state = 'idle'
      })
    )
    // random movement ai executor
    this.register(
      world.clock.on('tick', () => {
        if (this.state !== 'idle') return
        if (!this.renderable.position) return
        const moveChance = 0.05
        if (Math.random() > moveChance) return
        const moveBoxLimit = 300
        const point: Point = {
          x:
            Math.floor(Math.random() * moveBoxLimit - moveBoxLimit / 2) +
            this.renderable.position.x,
          y:
            Math.floor(Math.random() * moveBoxLimit - moveBoxLimit / 2) +
            this.renderable.position.y,
        }
        this.move(point)
      })
    )
    // fulfill needs
    this.register(
      world.clock.on('hour', () => {
        if (this.activeTask) return
        const need = this.needs.getNeed()
        console.log(`Doing ${need}`)
        // No needs -> chill like an animal.
        if (need === undefined) return

        const poll = () => {
          if (!queue) throw new Error('Missing queue')
          const task = queue[0]
          if (task !== undefined) {
            task.execute(worker)
            this.activeTask = task
            return
          }
          this.activeTask = undefined
        }

        const worker: Worker = {
          inventory: this.inventory,
          move: (point) => this.move(point),
          hold: (point) => this.hold(point),
          stop: () => this.stop(),
          schedule: (task) => {
            if (!queue) throw new Error('Missing queue')
            queue.push(task)
          },
          onFinished: () => {
            if (!queue) throw new Error('Missing queue')
            // If task is finished, remove it from queue.
            queue.shift()
            poll()
          },
        }

        // Find a way to fulfill a need and schedule tasks.
        let queue = this.needsCentricTasks.get(need)
        // Already has scheduled tasks -> do it.
        if (queue !== undefined && queue.length !== 0) {
          console.log('Found unfinished task, continue')
          poll()
          return
        }
        queue = []
        this.needsCentricTasks.set(need, queue)
        // Or create it:
        // find suitable recipe and schedule task tree.
        console.log('Lookup recipe and start it')
        const targetRecipe = RECIPES[need]
        loadTaskTree(targetRecipe, worker).schedule(worker)
        poll()
      })
    )
    // reset needs
    this.register(
      world.clock.on('month', () => {
        console.log('Restart needs chain')
        this.needs.reset()
        this.activeTask?.pause()
      })
    )
  }
}

export class Bunny extends AnimalAgentBase {
  constructor() {
    super({
      health: 10,
    })
    this.renderable.kind = 'bunny'
  }
}
