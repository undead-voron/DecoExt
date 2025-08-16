import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((tab: browser.Tabs.OnActivatedActiveInfoType) => unknown)

const listeners = new Set<(tab: browser.Tabs.OnActivatedActiveInfoType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.tabs.onActivated.addListener((tab) => {
    for (const listener of listeners)
      listener(tab)
  })
})

const {
  decorator,
  listenerWrapper,
} = buildDecoratorAndMethodWrapper<browser.Tabs.OnActivatedActiveInfoType, AllowedListener>('tabActivatedDetails')

export const activatedTabDetails = decorator

/**
 * @overview
 *
 * Decorator that handles tab focus change event
 * Simply calls methods for browser.tabs.onActivated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that represents the tab object browser.Tabs.OnActivatedActiveInfoType
 */
export function onTabActivated<T extends AllowedListener>({ filter }: { filter?: (tab: browser.Tabs.OnActivatedActiveInfoType) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
