import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((historyItem: browser.History.HistoryItem) => unknown)

const listeners = new Set<(historyItem: browser.History.HistoryItem) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.history.onVisited.addListener((historyItem) => {
    for (const listener of listeners)
      listener(historyItem)
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<browser.History.HistoryItem, AllowedListener>('historyItem')

export const historyItem = decorator

/**
 * @overview
 *
 * Decorator that handles history visit events
 * Simply calls methods for browser.history.onVisited.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'historyItem' property with the interface matching browser.History.HistoryItem type
 * unless parameter decorators are used.
 */
export function onHistoryVisited<T extends AllowedListener>({ filter }: { filter?: (historyItem: browser.History.HistoryItem) => boolean | Promise<boolean> }) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
