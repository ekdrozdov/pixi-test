import { Disposable, DisposableStorage } from '../utils/lifecycle'
import {
  DisposableEventEmitter,
  Event,
  EventEmitter,
  EventEmitterBase,
} from '../utils/events'

export type GameClockEvents = {
  /**
   * Tick represents a minimal game time unit.
   */
  tick: void
  /**
   * Represents a game hour.
   */
  hour: void
}

export interface GameClock extends Event<GameClockEvents> {
  readonly years: number
  readonly days: number
  readonly hours: number
  readonly minutes: number
  resume(): void
  pause(): void
  /**
   * Sets how many times per second tick happens.
   */
  setFreq(value: number): void
}

export class GameClockBase
  extends EventEmitterBase<GameClockEvents>
  implements GameClock
{
  years = 0
  days = 0
  hours = 0
  minutes = 0

  private _intervalId?: ReturnType<typeof setInterval>
  private _isRunning = false

  constructor() {
    super()
    this.setFreq(1)
  }

  resume(): void {
    this._isRunning = true
  }

  pause(): void {
    this._isRunning = false
  }
  setFreq(value: number): void {
    clearInterval(this._intervalId)
    if (value === 0) return
    this._intervalId = setInterval(() => {
      this._isRunning && this.dispatch('tick', undefined), 1000 / value

      this.minutes = ++this.minutes % 60
      if (this.minutes !== 0) return
      this.hours = ++this.hours % 24
      if (this.hours !== 0) {
        this.dispatch('hour', undefined)
        return
      }
      this.days = ++this.days % 30
      if (this.days !== 0) return
      this.years = ++this.years % 365
    })
  }
}
