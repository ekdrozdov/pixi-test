import { fit } from '../utils/math'
import { Point } from '../renderer/renderable'
import { SceneObject, SceneObjectBase } from './scene'
import { World } from './world'

type BiologicalState = 'idle' | 'sleeping' | 'moving' | 'eating'

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
  // need: state, update and fulfill behavior; adds a state and transition
  readonly rest: number
  readonly food: number
  readonly breeding: number
  readonly speed: number
}

export interface Plant extends SceneObject, BiologicalModel {}

export interface Animal extends SceneObject, Biological, AnimalModel {
  move(point: Point): void
  sleep(): void
  eat(target: Plant): void
  breed(target: never): void
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

export class Bush extends BiologicalBase implements Plant {
  object: SceneObject
  constructor(model?: Partial<BiologicalModel>) {
    super(model)
    this.object = new SceneObjectBase()
  }
}

function isReachable(source: Point, target: Point) {
  const eps = 4
  return distance(source, target) < eps
}

function distance(source: Point, target: Point) {
  return Math.abs(source.x - target.x) + Math.abs(source.y - target.y)
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
    this.breeding = model?.breeding ?? 1

    this.speed = model?.speed ?? 5
  }

  sleep(): void {
    this.state = 'sleeping'
  }

  eat(target: Plant): void {
    this.state = 'eating'
    // rm target
  }

  breed(target: Bunny): void {
    // if (target.)
  }

  move(point: Point): void {
    this._moveTarget = point
    this.isBusy = true
  }

  override onMount(world: World): void {
    super.onMount(world)
    this.register(
      // biology executor
      world.clock.on('hour', () => {
        this.breeding -= 0.005

        // eating state
        if (this.state === 'eating') {
          this.food = 1
          this.state = 'idle'
        } else {
          this.food -= 0.03
        }
        if (this.food <= 0) this.health = this.health + this.food

        // sleep state
        if (this.state === 'sleeping') {
          // awake
          if (this.rest >= 1) this.state = 'idle'
          // better sleep at night?
          this.rest += 0.125
        } else {
          this.rest -= 0.05
          if (this.rest <= 0) this.health = this.health + this.rest
        }

        // health
        if (this.health <= 0) this.die()
      })
    )
    this.register(
      // movement executor
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
      // random movement ai executor
      world.clock.on('tick', () => {
        if (this.state !== 'idle') return
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
        this.move(point)
      })
    )
    this.register(
      // generic bio ai executor
      world.clock.on('tick', () => {
        if (this.state === 'sleeping') return
        // sleep
        if (this.rest <= 0.2) {
          this.sleep()
          return
        }
        // feed
        if (this.food <= 0.5) {
          const candidates = this._world.scene.all<Bush>(Bush)
          if (candidates.length === 0) return
          const target = candidates
            .map((candidate) => ({
              dist: distance(
                this.renderable.position!,
                candidate.renderable.position!
              ),
              obj: candidate,
            }))
            .sort(({ dist }, { dist: dist2 }) => dist - dist2)[0]
          if (
            !isReachable(
              this.renderable.position!,
              target.obj.renderable.position!
            )
          ) {
            this.move(target.obj.renderable.position!)
          } else {
            this.eat(target.obj)
          }

          // search for a target
        }
        // breed
        if (this.breeding <= 0) {
          // const candidates = this._world.scene.all<Bunny>(Bunny)
          // search for a target
        }
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
