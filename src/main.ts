import * as PIXI from "pixi.js"
import { ai, scene } from "./game"

const app = new PIXI.Application({
  background: "#1099bb",
  resizeTo: window,
})

document.body.appendChild(app.view as any)

// create a new Sprite from an image path
const bunny = PIXI.Sprite.from("https://pixijs.com/assets/bunny.png")

// center the sprite's anchor point
bunny.anchor.set(0.5)

// move the sprite to the center of the screen
bunny.x = app.screen.width / 2
bunny.y = app.screen.height / 2

app.stage.addChild(bunny)

const agents = scene.agents.map((agent) =>
  PIXI.Sprite.from("https://pixijs.com/assets/bunny.png")
)
agents.forEach((agent) => app.stage.addChild(agent))

// Listen for animate update
app.ticker.add((delta) => {
  // just for fun, let's rotate mr rabbit a little
  // delta is 1 if running at 100% performance
  // creates frame-independent transformation
  bunny.rotation += 0.1 * delta

  scene.agents.forEach((agent) => ai(agent))
  agents.forEach((agent, i) => {
    agent.x = scene.agents[i].position.x
    agent.y = scene.agents[i].position.y
  })
})
