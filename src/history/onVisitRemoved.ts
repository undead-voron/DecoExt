import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((removed: browser.History.OnVisitRemovedRemovedType) => unknown)

const listeners = new Set<(removed: browser.History.OnVisitRemovedRemovedType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.history.onVisitRemoved.addListener((removed) => {
    for (const listener of listeners)
      listener(removed)
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<browser.History.OnVisitRemovedRemovedType, AllowedListener>('removedInfo')

export const removedInfo = decorator

/**
 * @overview
 *
 * Decorator that handles history visit removal events
 * Simply calls methods for browser.history.onVisitRemoved.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'removed' property with the interface matching RemovedVisits type
 * unless parameter decorators are used.
 */
export function onHistoryVisitRemoved<T extends AllowedListener>({ filter }: { filter?: (removed: browser.History.OnVisitRemovedRemovedType) => boolean | Promise<boolean> }) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
