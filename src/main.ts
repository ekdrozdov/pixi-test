import { Bunny } from './game/agent'
import { WorldBase } from './game/world'
import { PixiRenderer } from './renderer/pixi/pixiRenderer'

const world = new WorldBase({ size: { x: 500, y: 500 } })
const renderer = new PixiRenderer()
renderer.render(world)
const bunny = new Bunny()
bunny.renderable.position = { x: world.size.x / 2, y: world.size.y / 2 }
world.scene.mount(bunny)
world.clock.setFreq(1)
world.clock.resume()

// clock.on('tick', () => {
//   basicText.text = `days: ${clock.days}, hours: ${clock.hours}, minutes: ${clock.minutes}`
// })
// clock.on('tick', () => {
//   scene.all<AnimalAgent>(AnimalAgentBase).forEach((agent) => {
//     ai(agent)
//     agent.controller.execute()
//   })
// })

// const spawnAction = new Spawn(scene)
// viewport.addListener('clicked', (e) => {
//   const agents = scene.all()
//   const eps = 10
//   const selection = agents.find(
//     (agent) =>
//       Math.abs(agent.object.renderable.x - e.world.x) < eps &&
//       Math.abs(agent.object.renderable.y - e.world.y) < eps
//   )
//   if (selection && selection instanceof Bunny) {
//     infoDiv.textContent = `agent #${selection.object.id.toString()}, health: ${
//       selection.health
//     }, food: ${selection.food}`
//     return
//   }
//   spawnAction.execute(new Bunny(), e.world)
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
