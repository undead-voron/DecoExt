import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { details: browser.WebNavigation.OnErrorOccurredDetailsType }) => unknown)

const listeners = new Set<(details: browser.WebNavigation.OnErrorOccurredDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onErrorOccurred.addListener((details) => {
    for (const listener of listeners)
      listener(details)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.WebNavigation.OnErrorOccurredDetailsType, AllowedListener>('navigationErrorDetails')

export const navigationErrorDetails = decorator
/*
 * @overview
 *
 * Decorator that handles webNavigation error events
 * Simply calls methods for browser.webNavigation.onErrorOccurred.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'details' property
 * unless parameter decorators are used.
 */
export function onNavigationError<T extends AllowedListener>() {
  // TODO: add filtering
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
