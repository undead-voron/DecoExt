import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { historyItem: browser.History.HistoryItem }) => unknown)

const listeners = new Set<(arg: { historyItem: browser.History.HistoryItem }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.history.onVisited.addListener((historyItem) => {
    for (const listener of listeners)
      listener({ historyItem })
  })
})

const historyItemDecoratorInfo = createDecorator<keyof browser.History.HistoryItem | void>('historyItem')

export const historyItem = historyItemDecoratorInfo.decorator

// map onVisited data to parameter decorators
function decoratorsHandler(arg: { historyItem: browser.History.HistoryItem }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingHistoryItemParameters: { index: number, key?: keyof browser.History.HistoryItem }[] = Reflect.getOwnMetadata(historyItemDecoratorInfo.key, constructor, propertyKey) || []

  if (existingHistoryItemParameters.length) {
    const customArg = []
    for (const { index, key } of existingHistoryItemParameters) {
      customArg[index] = key ? arg.historyItem[key] : arg.historyItem
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { historyItem: browser.History.HistoryItem }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

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
 * Decorator that handles history visit events
 * Simply calls methods for browser.history.onVisited.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'historyItem' property with the interface matching browser.History.HistoryItem type
 * unless parameter decorators are used.
 */
export function onHistoryVisited<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}

