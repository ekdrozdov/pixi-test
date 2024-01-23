import { Point } from '../../renderer/renderable'

interface Movable {
  move(point: Point): void
}

interface State {
  execute()
}
