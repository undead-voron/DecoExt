import type { Tabs } from 'webextension-polyfill'

import { describe, expect, it, vi } from 'vitest'
import { activatedTabDetails, createdTabDetails, onTabActivated, onTabCreated, onTabRemoved, onTabUpdated, removedTabDetails, tabUpdatedTab } from '.'
import { resolve } from '../instanceResolver'
import { InjectableService } from '../service'

describe('tab events', async () => {
  const fakeTab: Tabs.Tab = {
    id: 33298329,
    index: 3,
    highlighted: false,
    active: true,
    pinned: false,
    incognito: false,
  }
  const spyTarget = { checkCall: (..._args: any[]) => { }, checkArgs: (..._args: any[]) => { } }
  vi.spyOn(spyTarget, 'checkCall')
  vi.spyOn(spyTarget, 'checkArgs')

  const mocks = vi.hoisted(() => {
    class EventsMock<T extends Array<unknown>> {
      listeners = new Set<(...args: any[]) => any>()
      trigger(...info: T): void {
        for (const listener of this.listeners) {
          listener(...info)
        }
      }

      addListener(listener: (...args: any[]) => any): void {
        this.listeners.add(listener)
      }
    }

    return {
      default: {
        tabs: {
          onActivated: new EventsMock<[Tabs.OnActivatedActiveInfoType]>(),
          onCreated: new EventsMock<[Tabs.Tab]>(),
          onRemoved: new EventsMock<[number, Tabs.OnRemovedRemoveInfoType]>(),
          onUpdated: new EventsMock<[number, Tabs.OnUpdatedChangeInfoType, Tabs.Tab]>(),
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
    @onTabActivated()
    onTabActivated(arg: Tabs.OnActivatedActiveInfoType): void {
      spyTarget.checkCall(arg)
    }

    @onTabUpdated()
    @onTabCreated()
    @onTabActivated()
    @onTabRemoved()
    someOtherMethod(
      @removedTabDetails('tabId') @activatedTabDetails('tabId') @createdTabDetails('id') @tabUpdatedTab('id') tabId: number,
    ): void {
      spyTarget.checkArgs(tabId)
    }

    @onTabCreated()
    onTabCreatedListener(tab: Tabs.Tab) {
      spyTarget.checkCall(tab)
    }

    @onTabRemoved()
    onTabRemovedListener(info: Tabs.OnRemovedRemoveInfoType & { tabId: number }) {
      spyTarget.checkCall(info)
    }
  }

  const testingInstance = resolve(TestInjectable)

  await testingInstance.init()

  it('activated', async () => {
    mocks.default.tabs.onActivated.trigger({ tabId: fakeTab.id!, windowId: 10 })

    await testingInstance.init()
    expect(spyTarget.checkArgs).toBeCalledTimes(1)
    expect(spyTarget.checkArgs).toBeCalledWith(fakeTab.id)
    expect(spyTarget.checkCall).toBeCalledWith({ tabId: fakeTab.id!, windowId: 10 })
  })

  it('created', async () => {
    mocks.default.tabs.onCreated.trigger(fakeTab)
    await testingInstance.init()
    // check that parameter decorator maps data as expected
    expect(spyTarget.checkArgs).toBeCalledWith(fakeTab.id)
    // check that method decorator passes object as expected
    expect(spyTarget.checkCall).toBeCalledWith(fakeTab)
  })

  it('removed', async () => {
    const removedTab: Tabs.OnRemovedRemoveInfoType = { windowId: 1, isWindowClosing: false }
    const tabId = 100
    mocks.default.tabs.onRemoved.trigger(tabId, removedTab)
    await testingInstance.init()
    // check that parameter decorator maps data as expected
    expect(spyTarget.checkArgs).toBeCalledWith(tabId)
    // check that method decorator passes object as expected
    expect(spyTarget.checkCall).toBeCalledWith({ ...removedTab, tabId })
  })

  it('updated', async () => {
    const fakeUpdatedTab = { ...fakeTab, id: 111 }
    const tabUpdatedDetails: Tabs.OnUpdatedChangeInfoType = { title: 'new title' }
    mocks.default.tabs.onUpdated.trigger(fakeUpdatedTab.id, tabUpdatedDetails, fakeUpdatedTab)
    await testingInstance.init()
    expect(spyTarget.checkArgs).toBeCalledWith(fakeUpdatedTab.id)
  })
})
