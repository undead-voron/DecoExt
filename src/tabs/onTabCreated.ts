import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((tab: browser.Tabs.Tab) => unknown)

const listeners = new Set<(tab: browser.Tabs.Tab) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.tabs.onCreated.addListener((tab) => {
    for (const listener of listeners)
      listener(tab)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.Tabs.Tab, AllowedListener>('tabCreatedDetails')

export const createdTabDetails = decorator

/**
 * @overview
 *
 * Decorator that handles tab created event
 * Simply calls methods for browser.tabs.onCreated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that represents the tab object browser.Tabs.Tab.
 */
export function onTabCreated<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
