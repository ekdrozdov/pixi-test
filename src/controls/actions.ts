import { Agent, SceneObject } from '../agent'
import { Point } from '../game'
import { Scene } from '../scene'

export class Spawn {
  constructor(private readonly _scene: Scene) {}
  execute(agent: Agent, position: Point) {
    this._scene.add(agent)
    agent.object.renderable.x = position.x
    agent.object.renderable.y = position.y
  }
}
