import { AnimalAgent, SceneObject } from './agent'
import { Event, EventEmitterBase } from './events'

export interface Point {
  x: number
  y: number
}

export interface Renderable extends Point {
  readonly id: string
  bindTo(sceneObj: Point): void
}

export class RenderableImpl implements Renderable {
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

export interface Controller {
  isBusy: boolean
  execute(): void
}

export interface AnimalController extends Controller {
  moveTo(point: Point): void
}

function fit(target: number, absLimit: number) {
  if (target < 0) {
    return Math.max(target, -absLimit)
  }
  return Math.min(target, absLimit)
}

export class AnimalControllerBase implements AnimalController {
  private _moveTarget?: Point
  isBusy = false
  private _target?: AnimalAgent
  moveTo(point: Point): void {
    this._moveTarget = point
    this.isBusy = true
  }
  setTarget(target: AnimalAgent) {
    this._target = target
  }
  execute() {
    if (!this._target) return
    if (!this._moveTarget) return
    if (!this._target.isAlive) return
    // move bunny towards target with max speed available
    // move by x
    const { renderable } = this._target.object
    const dx = fit(this._moveTarget.x - renderable.x, this._target.speed)
    const dy = fit(this._moveTarget.y - renderable.y, this._target.speed)
    renderable.x = renderable.x + dx
    renderable.y = renderable.y + dy
    if (
      renderable.x === this._moveTarget.x &&
      renderable.y === this._moveTarget.y
    )
      this.isBusy = false
  }
}

// let's add an ai which will order bunny to move at
// random point in square of 500 in case bunny is
// not moving with a chance of 0.1.
const moveChance = 0.05
const moveBoxLimit = 300
export function ai(agent: AnimalAgent) {
  if (agent.controller.isBusy) return
  if (Math.random() > moveChance) return
  const point: Point = {
    x:
      Math.floor(Math.random() * moveBoxLimit - moveBoxLimit / 2) +
      agent.object.renderable.x,
    y:
      Math.floor(Math.random() * moveBoxLimit - moveBoxLimit / 2) +
      agent.object.renderable.y,
  }
  agent.controller.moveTo(point)
}

type GameClockEvents = {
  tick: void
}

interface GameTime {
  readonly years: number
  readonly days: number
  readonly hours: number
  readonly minutes: number
}

export interface Disposable {
  dispose(): void
}

class DisposableStorage implements Disposable {
  private _storage: Disposable[] = []
  register(d: Disposable) {
    this._storage.push(d)
  }
  dispose(): void {
    this._storage.forEach(({ dispose }) => dispose())
    this._storage = []
  }
}

export class GameTimeBase extends DisposableStorage implements GameTime {
  years: number = 0
  days: number = 0
  hours: number = 0
  minutes: number = 0
  constructor(clock: GameClock) {
    super()
    this.register(
      clock.on('tick', () => {
        this.minutes = ++this.minutes % 60
        if (this.minutes !== 0) return
        this.hours = ++this.hours % 24
        if (this.hours !== 0) return
        this.days = ++this.days % 30
        if (this.days !== 0) return
        this.years = ++this.years % 365
      })
    )
  }
}

interface GameClock extends Event<GameClockEvents> {
  /**
   * Tick represents 1 game minute.
   * Tick frequency is how many times tick happens per real world second.
   * To speed up a simulation, increase frequency.
   */
  tickFreq: number
  start(): void
  pause(): void
}

export class GameClockBase
  extends EventEmitterBase<GameClockEvents>
  implements GameClock
{
  private _intervalId?: ReturnType<typeof setInterval>
  private _isRunning = false

  private _tickFreq: number
  public get tickFreq() {
    return this._tickFreq
  }
  public set tickFreq(value) {
    this._tickFreq = value
    clearInterval(this._intervalId)
    this._intervalId = setInterval(
      () => this._isRunning && this.dispatch('tick', undefined),
      1000 / this._tickFreq
    )
  }

  constructor(tickFreq = 1) {
    super()
    this._tickFreq = 0
    this.tickFreq = tickFreq
  }
  start(): void {
    this._isRunning = true
  }
  pause(): void {
    this._isRunning = false
  }
}
