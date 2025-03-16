import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((details: browser.WebNavigation.OnCommittedDetailsType) => unknown)

const listeners = new Set<(details: browser.WebNavigation.OnCommittedDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onCommitted.addListener((details) => {
    for (const listener of listeners)
      listener(details)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.WebNavigation.OnCommittedDetailsType, AllowedListener>('committedNavigationDetails')

export const navigationCommittedDetails = decorator

/**
 * @overview
 *
 * Decorator that handles webNavigation committed events
 * Simply calls methods for browser.webNavigation.onCommitted.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when navigation is committed.
 * The method is called with a 'details' parameter by default unless parameter decorators are used.
 */
export function onNavigationCommitted<T extends AllowedListener>() {
  // TODO: add filtering
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
