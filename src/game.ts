import { DisplayObject } from "pixi.js"

class Position {
  x = 200
  y = 200
}

class Agent {
  position = new Position()
}

const moveChance = 0.1
const avgMove = 5

export function ai(agent: Agent) {
  if (Math.random() > moveChance) return
  const dx = Math.random() * avgMove * 2 - avgMove
  const dy = Math.random() * avgMove * 2 - avgMove
  agent.position.x += dx
  agent.position.y += dy
}

interface Renderable {
  x: number
  y: number
}

interface Scene {
  mount(x: Renderable): void
}

class Scene {
  agents: Agent[] = []
}

export const scene = new Scene()
scene.agents.push(new Agent())
scene.agents.push(new Agent())
scene.agents.push(new Agent())
