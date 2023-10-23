import { World } from '../game/world'
import { EventEmitter } from '../utils/events'
import { Point } from './renderable'

export type RendererEvent = {
  click: { position: Point }
}

export interface Renderer extends EventEmitter<RendererEvent> {
  render(world: World): void
}
