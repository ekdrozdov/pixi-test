import { Viewport } from 'pixi-viewport'
import { Renderable } from './renderable'
import { Agent, BiologicalBase, SceneObject } from './agent'
import { Container, Sprite } from 'pixi.js'
import { GameClock } from './time'

export interface Scene {
  add(agent: Agent): void
  remove(agent: Agent): void
  all(): readonly Agent[]
  all<T extends Agent>(_class: new () => T): readonly T[]
}

export class SceneBase implements Scene {
  private readonly _objs: Agent[] = []
  add(agent: Agent): void {
    // add onMount, onDismount
    // const sprite = Sprite.from(agent.object.renderable.id)
    // sprite.anchor.set(0.5)
    // this._viewport.addChild(sprite)
    // agent.object.renderable.bindTo(sprite)

    this._objs.push(agent)
    // // ??!
    // if (agent instanceof BiologicalBase)
    //   this._clock.on('hour', () => agent.onHour())
  }
  remove(agent: Agent): void {
    throw new Error('Method not implemented.')
  }

  all(): readonly Agent[]
  all<T extends Agent>(_class: new (...args: any) => T): readonly T[]
  all<T extends Agent>(_class?: new () => T): readonly T[] | readonly Agent[] {
    if (!_class) return this._objs
    return this._objs.filter((obj) => obj instanceof _class)
  }
}
