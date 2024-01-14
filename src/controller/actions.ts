import { Renderable } from '../game/agent/animal'
import { SceneObject } from '../game/sceneObject'
import { Point } from '../renderer/renderable'
import { Scene } from '../game/scene'

export class Spawn {
  constructor(private readonly _scene: Scene) {}
  execute(agent: Renderable, position: Point) {
    this._scene.mount(agent)
    agent.object.position.x = position.x
    agent.object.position.y = position.y
  }
}
