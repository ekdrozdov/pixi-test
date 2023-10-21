import * as PIXI from 'pixi.js'

interface Point {
  x: number
  y: number
}

interface Renderable extends Point {
  readonly id: string
  bindTo(sceneObj: Point): void
}

class RenderableImpl implements Renderable {
  id: string
  public get x(): number {
    return this._sceneObj?.x ?? 0
  }
  public set x(value: number) {
    this._sceneObj && (this._sceneObj.x = value)
  }
  public get y(): number {
    return this._sceneObj?.y ?? 0
  }
  public set y(value: number) {
    this._sceneObj && (this._sceneObj.y = value)
  }
  private _sceneObj?: Point
  constructor(id: string) {
    this.id = id
    this.y = 0
  }
  bindTo(sceneObj: Point): void {
    this._sceneObj = sceneObj
  }
}

interface Scene {
  add(obj: Renderable): void
  remove(obj: Renderable): void
}

interface Controller {
  moveTo(point: Point): void
  execute(): void
}

interface Agent {
  readonly renderable: Renderable
  readonly controller: Controller
  speed: number
  isMoving: boolean
}

function fit(target: number, absLimit: number) {
  if (target < 0) {
    return Math.max(target, absLimit)
  }
  return Math.min(target, absLimit)
}

class ControllerImpl implements Controller {
  private _moveTarget?: Point
  constructor(private readonly _target: Agent) {}
  moveTo(point: Point): void {
    this._moveTarget = point
    this._target.isMoving = true
  }
  execute() {
    if (!this._moveTarget) return
    // move bunny towards target with max speed available
    // move by x
    const { renderable } = this._target
    const dx = fit(this._moveTarget.x - renderable.x, this._target.speed)
    const dy = fit(this._moveTarget.y - renderable.y, this._target.speed)
    console.log(dx)
    renderable.x = renderable.x + dx
    renderable.y = renderable.y + dy
    if (
      renderable.x === this._moveTarget.x &&
      renderable.y === this._moveTarget.y
    )
      this._target.isMoving = false
  }
}

export class Bunny implements Agent {
  renderable: Renderable
  controller: Controller
  speed = 5
  isMoving = false
  constructor() {
    this.renderable = new RenderableImpl('https://pixijs.com/assets/bunny.png')
    this.controller = new ControllerImpl(this)
  }
}

export class PixiScene implements Scene {
  add(obj: Renderable): void {
    const sprite = PIXI.Sprite.from(obj.id)
    sprite.anchor.set(0.5)
    obj.bindTo(sprite)
    this._app.stage.addChild(sprite)
  }
  remove(obj: Renderable): void {
    throw new Error('Method not implemented.')
  }
  constructor(private readonly _app: PIXI.Application<PIXI.ICanvas>) {}
}

// let's add an ai which will order bunny to move at
// random point in square of 500 in case bunny is
// not moving with a chance of 0.1.
const moveChance = 0.1
const moveBoxLimit = 10
export function ai(agent: Agent) {
  if (agent.isMoving) return
  if (Math.random() > moveChance) return
  const point: Point = {
    //x: Math.floor(Math.random() * moveBoxLimit),
    //y: Math.floor(Math.random() * moveBoxLimit),
    x: 100,
    y: 100,
  }
  agent.controller.moveTo(point)
}
