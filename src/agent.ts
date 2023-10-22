import {
  Renderable,
  Controller,
  RenderableImpl as RenderableBase,
  AnimalControllerBase as ControllerBase,
  AnimalController,
  AnimalControllerBase,
} from './game'

export interface SceneObject {
  readonly renderable: Renderable
  readonly id: number
}

export interface Agent {
  readonly controller: Controller
  readonly object: SceneObject
}

export interface BiologicalModel {
  health: number
  readonly age: number
  readonly isAlive: boolean
}

export interface AnimalModel extends BiologicalModel {
  readonly rest: number
  readonly food: number
  readonly breeding: number
  readonly speed: number
}

export interface Biological extends BiologicalModel {
  onHour(): void
  die(): void
}

export interface PlantAgent extends Agent, BiologicalModel {}

export interface AnimalAgent extends Agent, Biological, AnimalModel {
  controller: AnimalController
}

export class SceneObjectBase implements SceneObject {
  private static _objectsCounter = 0
  renderable: Renderable
  readonly id: number
  constructor(kind: string) {
    this.renderable = new RenderableBase(kind)
    this.id = SceneObjectBase._objectsCounter++
  }
}

export class BiologicalBase implements Biological {
  health: number
  age: number = 0
  isAlive = true
  private _hours = 0
  constructor(model?: Partial<BiologicalModel>) {
    this.health = model?.health ?? 100
    this.age = model?.age ?? 0
  }
  onHour(): void {
    if (!this.isAlive) return
    this._hours++
    if (this._hours % 8_760 === 0) this.age++
  }
  die(): void {
    this.isAlive = false
  }
}

export class Plant extends BiologicalBase implements PlantAgent {
  controller: Controller
  object: SceneObject
  constructor(kind: string, model?: Partial<BiologicalModel>) {
    super(model)
    this.controller = { execute: () => {}, isBusy: false }
    this.object = new SceneObjectBase(kind)
  }
}

export class AnimalAgentBase extends BiologicalBase implements AnimalAgent {
  controller: AnimalController
  object: SceneObject
  rest: number
  food: number
  breeding: number
  speed: number

  constructor(
    kind: string,
    controller: AnimalController,
    model?: Partial<AnimalModel>
  ) {
    super(model)
    this.controller = controller
    this.object = new SceneObjectBase(kind)

    this.rest = model?.rest ?? 0.5
    this.food = model?.food ?? 0.5
    this.breeding = model?.breeding ?? 0

    this.speed = model?.speed ?? 5
  }

  override onHour(): void {
    super.onHour()
    this.food += 0.1
    if (this.food >= 1) this.health = this.health - this.food
    if (this.health <= 0) this.die()
  }
}

export class Bunny extends AnimalAgentBase {
  constructor() {
    const controller = new AnimalControllerBase()
    super('https://pixijs.com/assets/bunny.png', controller)
    controller.setTarget(this)
  }
}
