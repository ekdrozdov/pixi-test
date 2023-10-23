export interface Point {
  x: number
  y: number
}

export type RenderableKind = 'bunny'

/**
 * Contains a data to render an entity. This data will be synced with actual renderer every frame.
 */
export interface Renderable {
  kind: RenderableKind
  position: Point
}
