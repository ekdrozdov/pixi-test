import { crop } from '../../utils/math'
import { Point } from '../../renderer/renderable'
import { SceneObject, SceneObjectBase } from '../scene'
import { World } from '../world'
import {
  GoodTag,
  GoodsContainer,
  GoodsContainerBase,
  RECIPES,
  Task,
  WorkerController,
} from '../goods-production/recieps'
import { NeedsChain, NeedsChainBase, NeedsSubject } from '../needs'
import {
  EstimationContext,
  ReqsTreeNode,
  buildRequirementsTreeFor,
  evalBestTask,
} from '../goods-production/aquisition'
import { Market } from '../market'

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
    console.log('dead')
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
  implements Animal, NeedsSubject, WorkerController, EstimationContext
{
  object: SceneObject
  speed: number
  private _moveTarget?: Point
  assets: GoodsContainer = new GoodsContainerBase()
  projects: Partial<Record<GoodTag, number>> = {}
  manager: NeedsDrivenTaskManager
  skill: Partial<Record<GoodTag, number | undefined>> = {}
  market?: Market

  constructor(model?: Partial<AnimalModel>) {
    super(model)
    this.object = new SceneObjectBase()
    this.speed = model?.speed ?? 5
    this.manager = new NeedsDrivenTaskManagerBase(this, this)
  }
  onFinished(): void {
    this.manager.fulfillNextNeed()
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
    this.register(
      world.clock.on('month', () => {
        this.manager.reset()
      })
    )
    this.manager.fulfillNextNeed()
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

export interface NeedsDrivenTaskManager {
  reset(): void
  fulfillNextNeed(): void
}

class NeedsDrivenTaskManagerBase {
  private readonly needs: NeedsChain
  private currentTask?: Task

  constructor(
    readonly controller: WorkerController,
    readonly context: EstimationContext
  ) {
    this.needs = new NeedsChainBase(this.controller)
  }

  reset() {
    this.needs.reset()
    this.currentTask?.cancel()
    this.currentTask = undefined
    this.fulfillNextNeed()
  }

  fulfillNextNeed() {
    const need = this.needs.getNeed()
    if (!need) return
    const recipe = RECIPES[need]
    const reqTree = buildRequirementsTreeFor(recipe.tag)
    this.currentTask = evalBestTask(reqTree, this.context)
    this.currentTask.execute(this.controller)
  }
}
