import browser, { Tabs } from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { details: browser.Tabs.OnUpdatedChangeInfoType, tabId: number, tab: browser.Tabs.Tab }) => unknown)

const listeners = new Set<(arg: { details: browser.Tabs.OnUpdatedChangeInfoType, tabId: number, tab: browser.Tabs.Tab }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.tabs.onUpdated.addListener((tabId, details, tab) => {
    for (const listener of listeners)
      listener({ tabId, details, tab })
  })
})

const detailsDecoratorInfo = createDecorator<keyof Tabs.OnUpdatedChangeInfoType | void>('tabUpdatedDetails')
const tabDecoratorInfo = createDecorator<keyof Tabs.Tab | void>('tabUpdatedTab')

export const tabUpdatedDetails = detailsDecoratorInfo.decorator
export const tabUpdatedTab = tabDecoratorInfo.decorator

// map onUpdated data to parameter decorators
function decoratorsHandler(arg: { tabId: number, details: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDetailsParameters: { index: number, key?: keyof typeof arg.details }[] = Reflect.getOwnMetadata(detailsDecoratorInfo.key, constructor, propertyKey) || []
  const existingTabParameters: { index: number, key?: keyof browser.Tabs.Tab }[] = Reflect.getOwnMetadata(tabDecoratorInfo.key, constructor, propertyKey) || []
  if (existingDetailsParameters.length || existingTabParameters.length) {
    const customArg = []
    for (const { index, key } of existingDetailsParameters) {
      customArg[index] = key ? arg.details[key] : arg.details
    }
    for (const { index, key } of existingTabParameters) {
      customArg[index] = key ? arg.tab[key] : arg.tab
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol, options: { filter?: (arg: { details: browser.Tabs.OnUpdatedChangeInfoType, tabId: number, tab: browser.Tabs.Tab }) => boolean | Promise<boolean> } = {}) {
  return async (arg: { details: browser.Tabs.OnUpdatedChangeInfoType, tabId: number, tab: browser.Tabs.Tab }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(arg))) {
      return
    }

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(arg, constructor, propertyKey))
  }
}

/**
 * @overview
 *
 * Decorator that handles tab update event
 * Simply calls methods for browser.tabs.onUpdated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'details' property with the interface matching browser.Tabs.OnUpdatedChangeInfoType type and tabId unless parameter decorators are used.
 */
export function onTabUpdated<T extends AllowedListener>({ filter }: { filter?: (arg: { details: browser.Tabs.OnUpdatedChangeInfoType, tabId: number, tab: browser.Tabs.Tab }) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
