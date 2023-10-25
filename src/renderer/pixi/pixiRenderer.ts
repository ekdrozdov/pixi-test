import { Viewport } from 'pixi-viewport'
import { Application, Container, DisplayObject, Sprite } from 'pixi.js'
import { World } from '../../game/world'
import { Renderer, RendererEvent } from '../renderer'
import { RenderableKind } from '../renderable'
import { Disposable, DisposableStorage } from '../../utils/lifecycle'
import { SceneObject } from '../../game/scene'
import { EventEmitterBase } from '../../utils/events'

const kindToSprite: Record<RenderableKind, string> = {
  bunny: 'https://pixijs.com/assets/bunny.png',
}

export class PixiRenderer
  extends EventEmitterBase<RendererEvent>
  implements Renderer
{
  private readonly _app: Application
  private session?: Disposable
  constructor() {
    super()
    this._app = new Application({
      background: '#1099bb',
      resizeTo: window,
    })
    document.body.appendChild(this._app.view as any)
  }
  render(world: World): void {
    this.session?.dispose()

    const tracker = new Map<SceneObject, DisplayObject>()

    const viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: world.size.x,
      worldHeight: world.size.y,
      events: this._app.renderer.events,
    })
    this._app.stage.addChild(viewport as any)
    viewport.drag().pinch().wheel().decelerate()

    world.scene.on('mount', ({ obj }) => {
      if (!obj.renderable.kind) throw new Error('Object kind is undefined')
      const sprite = Sprite.from(kindToSprite[obj.renderable.kind])
      sprite.anchor.set(0.5)
      viewport.addChild(sprite)
      tracker.set(obj, sprite)
    })
    world.scene.on('dismount', ({ obj }) => {
      const sprite = tracker.get(obj)
      if (!sprite) throw new Error('Missing object')
      viewport.removeChild(sprite)
      tracker.delete(obj)
    })

    const renderFrame = () => {
      for (const [{ renderable }, dObj] of tracker.entries()) {
        if (renderable.position) {
          dObj.x = renderable.position.x
          dObj.y = renderable.position.y
        }
        if (renderable.state) {
          if (renderable.state === 'dead') dObj.rotation = 90
        }
      }
    }

    this._app.ticker.add(renderFrame)

    this.session = {
      dispose: () => {
        this._app.ticker.remove(renderFrame)
        this._app.stage.removeChild(viewport)
      },
    }
  }
}

// const basicText = new PIXI.Text()
// basicText.x = 50
// basicText.y = 100
// app.stage.addChild(basicText)

// toPixiDisplayObject()
