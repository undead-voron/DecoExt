import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'

import { resolve } from '~/instanceResolver'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'

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

const detailsInfoDecorator = createDecorator<keyof browser.WebNavigation.OnTabReplacedDetailsType | void>('onHistoryStateUpdatedDetails')

function decoratorsHandler(arg: browser.WebNavigation.OnTabReplacedDetailsType, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDetailsParameters: { index: number, key?: keyof browser.WebNavigation.OnTabReplacedDetailsType }[] = Reflect.getOwnMetadata(detailsInfoDecorator.key, constructor, propertyKey) || []

  if (existingDetailsParameters.length) {
    const customArg = []
    for (const { index, key } of existingDetailsParameters) {
      customArg[index] = key ? arg[key] : arg
    }
    return customArg
  }
  else {
    return [arg]
  }
}
export const tabReplacedDetails = detailsInfoDecorator.decorator

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (details: browser.WebNavigation.OnTabReplacedDetailsType): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(details, constructor, propertyKey))
  }
}

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
export function onTabReplaced<T extends AllowedListener>() {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    createInitialListener()
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}

