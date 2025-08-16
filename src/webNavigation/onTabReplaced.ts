import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'

import { callOnce } from '~/utils'

interface TabReplacedDetails {
  replacedTabId: number
  tabId: number
  timeStamp: number
}

type AllowedListener =
  ((...args: any[]) => any) |
  (() => unknown) |
  ((details: browser.WebNavigation.OnTabReplacedDetailsType) => unknown)

const listeners = new Set<(details: TabReplacedDetails) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onTabReplaced.addListener((details) => {
    for (const listener of listeners) {
      listener(details)
    }
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.WebNavigation.OnTabReplacedDetailsType, AllowedListener>('onHistoryStateUpdatedDetails')

export const tabReplacedDetails = decorator

/**
 * @overview
 *
 * Decorator that handles web navigation tab replaced events
 * Simply calls methods for browser.webNavigation.onTabReplaced.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the contents of a tab is replaced by a different (usually previously pre-rendered) tab.
 * The method is called with a 'details' parameter by default unless parameter decorators are used.
 *
 * The 'details' parameter contains information about the replacement, including:
 * - replacedTabId: The ID of the tab that was replaced
 * - tabId: The ID of the tab that replaced the old tab
 * - timeStamp: The time when the replacement happened, in milliseconds since the epoch
 *
 * You can also use parameter decorators to access specific parameters:
 * - @tabReplacedDetails('replacedTabId'): The ID of the tab that was replaced
 * - @tabReplacedDetails('tabId'): The ID of the tab that replaced the old tab
 * - @tabReplacedDetails('timeStamp'): The time when the replacement happened
 */
export function onTabReplaced<T extends AllowedListener>({ filter }: { filter?: (details: TabReplacedDetails) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
