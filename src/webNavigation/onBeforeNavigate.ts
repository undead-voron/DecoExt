import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((details: browser.WebNavigation.OnBeforeNavigateDetailsType) => unknown)

const listeners = new Set<(details: browser.WebNavigation.OnBeforeNavigateDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onBeforeNavigate.addListener((details) => {
    for (const listener of listeners)
      listener(details)
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<browser.WebNavigation.OnBeforeNavigateDetailsType, AllowedListener>('navigationDetails')

export const navigationDetails = decorator

/**
 * @overview
 *
 * Decorator that handles webNavigation before navigate events
 * Simply calls methods for browser.webNavigation.onBeforeNavigate.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'details' property
 * unless parameter decorators are used.
 */
export function onBeforeNavigate<T extends AllowedListener>() {
  // TODO: add filtering option
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
