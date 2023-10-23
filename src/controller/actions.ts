import { Agent, SceneObject } from '../game/agent'
import { Point } from '../game/renderable'
import { Scene } from '../game/scene'

export class Spawn {
  constructor(private readonly _scene: Scene) {}
  execute(agent: Agent, position: Point) {
    this._scene.add(agent)
    agent.object.renderable.x = position.x
    agent.object.renderable.y = position.y
  }
}
