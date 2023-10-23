import { Point } from './renderable'
import { AnimalAgent } from './agent'

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
