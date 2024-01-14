import { getWorld } from '../../main'
import { Point } from '../../renderer/renderable'
import { DisposableStorage } from '../../utils/lifecycle'
import { estimateLocalFood } from '../world'
import { Movable, NeedsDrivenTaskManager } from './animal'

function follow(host: Movable, target: Point) {
  host.move(target)
}

class Villager {
  constructor(
    private readonly manager: NeedsDrivenTaskManager,
    private readonly rallypoint: Point,
    private readonly home: Point
  ) {}
  onFinished(): void {
    this.manager.fulfillNextNeed()
  }
  execute() {
    this.manager.fulfillNextNeed()
  }
}

class FollowerBase {
  constructor(private readonly leader: Point, private readonly host: Movable) {}
  execute() {
    getWorld().clock.on('hour', () => {
      this.host.move(this.leader)
    })
  }
}

interface Follower {
  migrate(): void
  camp(center: Point): void
}

interface Mode {}

interface ElderHost {
  followers: Follower[]
  position: Point
  move(point: Point): void
}

function estimateMinFoodToCamp(followers: number): number {
  return followers * 50
}

function estimateMinFoodToMigrate(followers: number): number {
  return followers * 10
}

const CLAN_REACH_RADIUS = 100

function searchFood(searcher: ElderHost, minFoorReq: number, radius: number) {
  const d = getWorld().clock.on('day', () => {
    if (estimateLocalFood(searcher.position, radius) >= minFoorReq) {
      searcher.followers.forEach((f) => f.camp(searcher.position))
      checkFood(
        searcher,
        estimateMinFoodToCamp(searcher.followers.length),
        CLAN_REACH_RADIUS
      )
      d.dispose()
      return
    }
    searcher.move({
      x: searcher.position.x + Math.floor(Math.random() * 100 - 50),
      y: searcher.position.y + Math.floor(Math.random() * 100 - 50),
    })
  })
}

function checkFood(host: ElderHost, min: number, radius: number) {
  const d = getWorld().clock.on('day', () => {
    if (estimateLocalFood(host.position, radius) < min) {
      searchFood(
        host,
        estimateMinFoodToMigrate(host.followers.length),
        CLAN_REACH_RADIUS
      )
      host.followers.forEach((f) => f.migrate())
      d.dispose()
    }
  })
}

function assignElderRole(host: ElderHost) {
  searchFood(
    host,
    estimateMinFoodToMigrate(host.followers.length),
    CLAN_REACH_RADIUS
  )
}
