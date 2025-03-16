import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type OnTabRemovedParameter = browser.Tabs.OnRemovedRemoveInfoType & { tabId: number }

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: OnTabRemovedParameter) => unknown)

const listeners = new Set<(arg: OnTabRemovedParameter) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.tabs.onRemoved.addListener((tabId, details) => {
    for (const listener of listeners)
      listener({ tabId, ...details })
  })
})

const {
  decorator,
  listenerWrapper,
} = buildDecoratorAndMethodWrapper<OnTabRemovedParameter, AllowedListener>('tabRemovedDetails')

export const removedTabDetails = decorator

/**
 * @overview
 *
 * Decorator that handles tab remove event
 * Simply calls methods for browser.tabs.onRemoved.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that represents removed tab with the interface matching browser.Tabs.OnRemovedRemoveInfoType type and extended with tabId.
 */
export function onTabRemoved<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
