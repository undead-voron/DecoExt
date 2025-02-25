import { describe, expect, it, vi } from 'vitest'

import { createCronJob } from './createCronJob'

describe('check module creation', () => {
  it('check', async () => {
    const mocks = vi.hoisted(() => {
      class AlarmsMock {
        listeners = new Map<string, (...args: any[]) => any>()
        get(name: string): undefined | ((...args: any[]) => any) {
          return this.listeners.get(name)
        }

        create(name: string, listener: (...args: any[]) => any): void {
          this.listeners.set(name, listener)
        }
      }
      const alarms = new AlarmsMock()
      return {
        default: {
          alarms,
        },
      }
    })

    // mock alarms api
    vi.mock('webextension-polyfill', () => {
      return {
        default: mocks.default,
      }
    })
    const spy = vi.spyOn(mocks.default.alarms, 'create')
    await createCronJob('check', { periodInMinutes: 10 })
    expect(spy).toBeCalledTimes(1)
    await createCronJob('check', { periodInMinutes: 10 })
    expect(spy).toBeCalledTimes(1)
  })
})
