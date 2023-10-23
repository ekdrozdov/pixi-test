import { Viewport } from 'pixi-viewport'
import { Application } from 'pixi.js'

const app = new Application({
  background: '#1099bb',
  resizeTo: window,
})
document.body.appendChild(app.view as any)
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: 1000,
  worldHeight: 1000,
  events: app.renderer.events,
})
app.stage.addChild(viewport as any)
viewport.drag().pinch().wheel().decelerate()

// const basicText = new PIXI.Text()
// basicText.x = 50
// basicText.y = 100
// app.stage.addChild(basicText)
