import { GoodTag, GOODS } from '../goods-production/recieps'
import { SceneObjectBase } from '../scene'

export class Tree extends SceneObjectBase {
  constructor() {
    super()
    this.renderable.kind = 'tree'
  }
}
export class Source extends SceneObjectBase {
  constructor(public tag: GoodTag) {
    super()
  }
}

export class TreeSource extends Source {
  constructor() {
    super(GOODS.TREE)
    this.renderable.kind = 'tree-source'
  }
}

export class AnimalSource extends Source {
  constructor() {
    super(GOODS.ANIMAL)
    this.renderable.kind = 'animal-source'
  }
}
