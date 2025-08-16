import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((details: browser.WebNavigation.OnDOMContentLoadedDetailsType) => unknown)

const listeners = new Set<(details: browser.WebNavigation.OnDOMContentLoadedDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onDOMContentLoaded.addListener((details) => {
    for (const listener of listeners)
      listener(details)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.WebNavigation.OnDOMContentLoadedDetailsType, AllowedListener>('domContentLoadedDetails')

export const domContentLoadedDetails = decorator

/**
 * @overview
 *
 * Decorator that handles webNavigation DOM content loaded events
 * Simply calls methods for browser.webNavigation.onDOMContentLoaded.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'details' property
 * unless parameter decorators are used.
 */
export function onDOMContentLoaded<T extends AllowedListener>({ filter }: { filter?: (details: browser.WebNavigation.OnDOMContentLoadedDetailsType) => boolean | Promise<boolean> } = {}) {
  // TODO: add filtering
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
