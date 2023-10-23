import { World, WorldBase } from './world'

export interface Game {
  world: World
  // ui, controller, etc
  init(): void
}

export class GameOverPixi implements Game {
  world: World = new WorldBase()
  init(): void {
    // clock.on('tick', () => {
    //   basicText.text = `days: ${clock.days}, hours: ${clock.hours}, minutes: ${clock.minutes}`
    // })
    // clock.on('tick', () => {
    //   scene.all<AnimalAgent>(AnimalAgentBase).forEach((agent) => {
    //     ai(agent)
    //     agent.controller.execute()
    //   })
    // })
    this.world.clock.go()
  }
}
