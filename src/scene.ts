import { Viewport } from 'pixi-viewport'
import { Renderable } from './game'
import { Agent, SceneObject } from './agent'
import { Container, Sprite } from 'pixi.js'

export interface Scene {
  add(agent: Agent): void
  remove(agent: Agent): void
  all(): readonly Agent[]
  all<T extends Agent>(_class: new () => T): readonly T[]
}

export class PixiScene implements Scene {
  private readonly _objs: Agent[] = []
  add(agent: Agent): void {
    const sprite = Sprite.from(agent.object.renderable.id)
    sprite.anchor.set(0.5)
    this._viewport.addChild(sprite)

    agent.object.renderable.bindTo(sprite)

    this._objs.push(agent)
  }
  remove(agent: Agent): void {
    throw new Error('Method not implemented.')
  }
  constructor(private readonly _viewport: Container) {}

  all(): readonly Agent[]
  all<T extends Agent>(_class: new (...args: any) => T): readonly T[]
  all<T extends Agent>(_class?: new () => T): readonly T[] | readonly Agent[] {
    if (!_class) return this._objs
    return this._objs.filter((obj) => obj instanceof _class)
  }
}
