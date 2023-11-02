export interface Point {
  x: number
  y: number
}

export type RenderableState = 'default' | 'dead'

export type RenderableKind = 'bunny' | 'tree' | 'tree-source' | 'animal-source'

/**
 * Contains a data to render an entity. This data will be synced with actual renderer every frame.
 */
export interface Renderable {
  kind: RenderableKind
  state: RenderableState
  position: Point
}
