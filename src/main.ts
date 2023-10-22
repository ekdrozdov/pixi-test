import * as PIXI from 'pixi.js'
import { GameClockBase, GameTimeBase, ai } from './game'
import { AnimalAgent, AnimalAgentBase, Bunny } from './agent'
import { Viewport } from 'pixi-viewport'
import { Spawn } from './controls/actions'
import { PixiScene } from './scene'

const app = new PIXI.Application({
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

const scene = new PixiScene(viewport)

const basicText = new PIXI.Text()
basicText.x = 50
basicText.y = 100
app.stage.addChild(basicText)

const clock = new GameClockBase()
const time = new GameTimeBase(clock)
clock.on('tick', () => {
  basicText.text = `days: ${time.days}, hours: ${time.hours}, minutes: ${time.minutes}`
})
clock.on('tick', () => {
  scene.all<AnimalAgent>(AnimalAgentBase).forEach((agent) => {
    ai(agent)
    agent.controller.execute()
  })
})
clock.start()

const spawnAction = new Spawn(scene)
viewport.addListener('clicked', (e) =>
  spawnAction.execute(new Bunny(), e.world)
)
