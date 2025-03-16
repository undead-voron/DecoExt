import type { Tabs } from 'webextension-polyfill'

import { describe, expect, it, vi } from 'vitest'
import { iconClickedDetails, onIconClicked } from '.'
import { resolve } from '../instanceResolver'
import { InjectableService } from '../service'

describe('onIconClicked', async () => {
  const fakeTab: Tabs.Tab = {
    id: 33298329,
    index: 3,
    highlighted: false,
    active: true,
    pinned: false,
    incognito: false,
  }
  const spyTarget = { checkCall: (..._args: any[]) => {}, checkArgs: (..._args: any[]) => {} }
  vi.spyOn(spyTarget, 'checkCall')
  vi.spyOn(spyTarget, 'checkArgs')

  const mocks = vi.hoisted(() => {
    class OnClickedMock {
      listeners = new Set<(...args: any[]) => any>()
      trigger(tab: Tabs.Tab): void {
        for (const listener of this.listeners) {
          listener(tab)
        }
      }

      addListener(listener: (...args: any[]) => any): void {
        this.listeners.add(listener)
      }
    }
    const onClicked = new OnClickedMock()
    return {
      default: {
        browserAction: {
          onClicked,
        },
      },
    }
  })

  // mock alarms api
  vi.mock('webextension-polyfill', () => {
    return {
      default: mocks.default,
    }
  })

  @InjectableService()
  class TestInjectable {
    @onIconClicked()
    someMethod(arg: Tabs.Tab): void {
      spyTarget.checkCall(arg)
    }

    @onIconClicked()
    someOtherMethod(@iconClickedDetails('id')tabId: number): void {
      spyTarget.checkArgs(tabId)
    }
  }
  const testingInstance = resolve(TestInjectable)
  vi.spyOn(testingInstance, 'someMethod')

  mocks.default.browserAction.onClicked.trigger(fakeTab)
  await testingInstance.init()

  it('property decorator without parameter decorator', async () => {
    expect(spyTarget.checkCall).toBeCalledTimes(1)
    expect(spyTarget.checkCall).toBeCalledWith(fakeTab)
  })
  it('property decorator with parameter decorator', async () => {
    expect(spyTarget.checkArgs).toBeCalledTimes(1)
    expect(spyTarget.checkArgs).toBeCalledWith(fakeTab.id)
  })
})
