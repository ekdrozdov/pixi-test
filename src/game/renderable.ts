export interface Point {
  x: number
  y: number
}

export interface Renderable extends Point {
  readonly id: string
  bindTo(sceneObj: Point): void
}

export class RenderableImpl implements Renderable {
  id: string
  public get x(): number {
    return this._sceneObj?.x ?? 0
  }
  public set x(value: number) {
    this._sceneObj && (this._sceneObj.x = value)
  }
  public get y(): number {
    return this._sceneObj?.y ?? 0
  }
  public set y(value: number) {
    this._sceneObj && (this._sceneObj.y = value)
  }
  private _sceneObj?: Point
  constructor(id: string) {
    this.id = id
    this.y = 0
  }
  bindTo(sceneObj: Point): void {
    this._sceneObj = sceneObj
  }
}
