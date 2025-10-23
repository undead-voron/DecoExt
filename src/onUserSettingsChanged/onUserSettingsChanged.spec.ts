import { describe, expect, it, vi } from 'vitest'
import { onUserSettingsChanged, userSettingsChangedDetails } from '.'
import { resolve } from '../instanceResolver'
import { InjectableService } from '../service'

describe('onUserSettingsChanged', async () => {
  const fakeChangeInfo = {
    isOnToolbar: true,
  }
  const spyTarget = { checkCall: (..._args: any[]) => {}, checkArgs: (..._args: any[]) => {} }
  vi.spyOn(spyTarget, 'checkCall')
  vi.spyOn(spyTarget, 'checkArgs')

  const mocks = vi.hoisted(() => {
    class OnUserSettingsChangedMock {
      listeners = new Set<(...args: any[]) => any>()
      trigger(changeInfo: { isOnToolbar: boolean }): void {
        for (const listener of this.listeners) {
          listener(changeInfo)
        }
      }

      addListener(listener: (...args: any[]) => any): void {
        this.listeners.add(listener)
      }
    }
    const onUserSettingsChanged = new OnUserSettingsChangedMock()
    return {
      default: {
        browserAction: {
          onUserSettingsChanged,
        },
      },
    }
  })

  // mock browserAction api
  vi.mock('webextension-polyfill', () => {
    return {
      default: mocks.default,
    }
  })

  @InjectableService()
  class TestInjectable {
    @onUserSettingsChanged()
    someMethod(arg: { isOnToolbar: boolean }): void {
      spyTarget.checkCall(arg)
    }

    @onUserSettingsChanged()
    someOtherMethod(@userSettingsChangedDetails('isOnToolbar')isOnToolbar: boolean): void {
      spyTarget.checkArgs(isOnToolbar)
    }
  }
  const testingInstance = resolve(TestInjectable)
  vi.spyOn(testingInstance, 'someMethod')

  mocks.default.browserAction.onUserSettingsChanged.trigger(fakeChangeInfo)
  await testingInstance.init()

  it('property decorator without parameter decorator', async () => {
    expect(spyTarget.checkCall).toBeCalledTimes(1)
    expect(spyTarget.checkCall).toBeCalledWith(fakeChangeInfo)
  })
  it('property decorator with parameter decorator', async () => {
    expect(spyTarget.checkArgs).toBeCalledTimes(1)
    expect(spyTarget.checkArgs).toBeCalledWith(fakeChangeInfo.isOnToolbar)
  })
})
