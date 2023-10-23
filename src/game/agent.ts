import { fit } from '../utils/math'
import { Point } from '../renderer/renderable'
import { SceneObject, SceneObjectBase } from './scene'
import { World } from './world'

export interface BiologicalModel {
  health: number
  readonly age: number
  readonly isAlive: boolean
}

export interface Biological extends BiologicalModel {
  die(): void
}

export interface AnimalModel extends BiologicalModel {
  readonly rest: number
  readonly food: number
  readonly breeding: number
  readonly speed: number
}

export interface Plant extends SceneObject, BiologicalModel {}

export interface Animal extends SceneObject, Biological, AnimalModel {
  moveTo(point: Point): void
}

export class BiologicalBase extends SceneObjectBase implements Biological {
  health: number
  age: number = 0
  isAlive = true
  private _hours = 0
  constructor(model?: Partial<BiologicalModel>) {
    super()
    this.health = model?.health ?? 100
    this.age = model?.age ?? 0
  }
  die(): void {
    this.isAlive = false
  }
  override onMount(world: World): void {
    super.onMount(world)
    this.register(
      world.clock.on('hour', () => {
        if (!this.isAlive) return
        this._hours++
        if (this._hours % 8_760 === 0) this.age++
      })
    )
  }
}

export class _Plant extends BiologicalBase implements Plant {
  object: SceneObject
  constructor(model?: Partial<BiologicalModel>) {
    super(model)
    this.object = new SceneObjectBase()
  }
}

export class AnimalAgentBase extends BiologicalBase implements Animal {
  object: SceneObject
  rest: number
  food: number
  breeding: number
  speed: number

  private _moveTarget?: Point
  private isBusy = false

  constructor(model?: Partial<AnimalModel>) {
    super(model)
    this.object = new SceneObjectBase()

    this.rest = model?.rest ?? 0.5
    this.food = model?.food ?? 0.5
    this.breeding = model?.breeding ?? 0

    this.speed = model?.speed ?? 5
  }

  moveTo(point: Point): void {
    this._moveTarget = point
    this.isBusy = true
  }

  override onMount(world: World): void {
    super.onMount(world)
    this.register(
      world.clock.on('hour', () => {
        this.food += 0.1
        if (this.food >= 1) this.health = this.health - this.food
        if (this.health <= 0) this.die()
      })
    )
    this.register(
      // controller
      world.clock.on('tick', () => {
        if (!this._moveTarget) return
        if (!this.isAlive) return
        const { position } = this.renderable
        if (!position) return
        const dx = fit(this._moveTarget.x - position.x, this.speed)
        const dy = fit(this._moveTarget.y - position.y, this.speed)
        position.x = position.x + dx
        position.y = position.y + dy
        if (
          position.x === this._moveTarget.x &&
          position.y === this._moveTarget.y
        )
          this.isBusy = false
      })
    )
    this.register(
      // ai
      world.clock.on('tick', () => {
        if (!this.renderable.position) return
        if (this.isBusy) return
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
        this.moveTo(point)
      })
    )
  }
}

export class Bunny extends AnimalAgentBase {
  constructor() {
    super()
    this.renderable.kind = 'bunny'
  }
}
