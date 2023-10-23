import { Scene, SceneBase } from './scene'
import { GameClock, GameClockBase } from './time'

export interface World {
  readonly height: number
  readonly width: number
  readonly scene: Scene
  readonly clock: GameClock
}

export class WorldBase implements World {
  height: number = 100
  width: number = 100
  scene: Scene = new SceneBase(this)
  clock: GameClock = new GameClockBase()
}
