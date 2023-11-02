import { Bunny } from './game/agent'
import { WorldBase } from './game/world'
import { PixiRenderer } from './renderer/pixi/pixiRenderer'
import { MenuRegistryBase, SpawnerSelector } from './ui/menu'

const world = new WorldBase({ size: { x: 500, y: 500 } })
const renderer = new PixiRenderer()
const registry = new MenuRegistryBase()
renderer.render(world, registry)
registry.register(new SpawnerSelector(renderer, world.scene))
const bunny = new Bunny()
bunny.renderable.position = { x: world.size.x / 2, y: world.size.y / 2 }
world.scene.mount(bunny)
world.clock.setFreq(60)
world.clock.resume()

export function getWorld() {
  return world
}

// clock.on('tick', () => {
//   basicText.text = `days: ${clock.days}, hours: ${clock.hours}, minutes: ${clock.minutes}`
// })
// clock.on('tick', () => {
//   scene.all<AnimalAgent>(AnimalAgentBase).forEach((agent) => {
//     ai(agent)
//     agent.controller.execute()
//   })
// })

// const infoDiv = document.createElement('div')
// infoDiv.style.position = 'absolute'
// infoDiv.style.top = '55px'
// infoDiv.style.left = '60px'
// infoDiv.style.zIndex = '10'
// document.body.appendChild(infoDiv)

// const timeDiv = document.createElement('div')
// timeDiv.style.position = 'absolute'
// timeDiv.style.top = '90px'
// timeDiv.style.left = '60px'
// timeDiv.style.zIndex = '10'
// const timeInput = document.createElement('input')
// timeInput.type = 'range'
// timeInput.min = '0'
// timeInput.max = '100'
// timeInput.id = 'time'
// timeInput.value = '1'
// const timeLabel = document.createElement('label')
// timeLabel.htmlFor = 'time'
// timeLabel.textContent = `Tick frequency: ${timeInput.value}`
// timeDiv.appendChild(timeInput)
// timeDiv.appendChild(timeLabel)
// document.body.appendChild(timeDiv)
// timeInput.addEventListener('change', (e) => {
//   timeLabel.textContent = `Tick frequency: ${timeInput.value}`
//   clock.setFreq(parseInt(timeInput.value))
// })
