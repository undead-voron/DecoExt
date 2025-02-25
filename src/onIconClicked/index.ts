import browser, { Tabs } from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = (...args: any[]) => any
  | (() => any)
  | ((tab: browser.Tabs.Tab) => unknown)
  | ((...args: (Tabs.Tab | (Tabs.Tab[keyof Tabs.Tab]))[]) => unknown)

const listeners = new Set<(details: browser.Tabs.Tab) => Promise<void>>()

const createInitialListener = callOnce(() => {
  const browserAction = browser.browserAction ?? browser.action
  if (browserAction) {
    browserAction.onClicked.addListener((tab: browser.Tabs.Tab) => {
      for (const listener of listeners)
        listener(tab)
    })
  }
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.Tabs.Tab, AllowedListener>('iconClickedDetails')

export const iconClickedDetails = decorator

/**
 * @overview
 *
 * Decorator that handles browser extension icon onClicked event
 * Simply calls methods for browser.browserAction.onClicked.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that represents the tab object browser.Tabs.Tab.
 */
export function onIconClicked<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
