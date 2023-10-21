import * as PIXI from 'pixi.js'
import { Bunny, PixiScene, ai } from './game'

const app = new PIXI.Application({
  background: '#1099bb',
  resizeTo: window,
})

document.body.appendChild(app.view as any)

const scene = new PixiScene(app)
const agent = new Bunny()
scene.add(agent.renderable)

agent.renderable.x = app.screen.width / 2
agent.renderable.y = app.screen.height / 2

// Listen for animate update
app.ticker.add((delta) => {
  ai(agent)
  agent.controller.execute()
})
