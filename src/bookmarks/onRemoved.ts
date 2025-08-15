import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { id: string, removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType }) => unknown)

const listeners = new Set<(arg: { id: string, removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.bookmarks.onRemoved.addListener((id, removeInfo) => {
    for (const listener of listeners)
      listener({ id, removeInfo })
  })
})

const bookmarkIdDecoratorInfo = createDecorator<'id' | void>('bookmarkRemovedId')
const removeInfoDecoratorInfo = createDecorator<keyof browser.Bookmarks.OnRemovedRemoveInfoType | void>('bookmarkRemoveInfo')

export const bookmarkRemovedId = bookmarkIdDecoratorInfo.decorator
export const bookmarkRemoveInfo = removeInfoDecoratorInfo.decorator

// map onRemoved data to parameter decorators
function decoratorsHandler(arg: { id: string, removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingIdParameters: { index: number, key?: 'id' }[] = Reflect.getOwnMetadata(bookmarkIdDecoratorInfo.key, constructor, propertyKey) || []
  const existingRemoveInfoParameters: { index: number, key?: keyof browser.Bookmarks.OnRemovedRemoveInfoType }[] = Reflect.getOwnMetadata(removeInfoDecoratorInfo.key, constructor, propertyKey) || []

  if (existingIdParameters.length || existingRemoveInfoParameters.length) {
    const customArg = []
    for (const { index, key } of existingIdParameters) {
      customArg[index] = key ? arg[key] : arg.id
    }
    for (const { index, key } of existingRemoveInfoParameters) {
      customArg[index] = key ? arg.removeInfo[key] : arg.removeInfo
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol, options: { filter?: (arg: { id: string, removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType }) => boolean | Promise<boolean> } = {}) {
  return async (arg: { id: string, removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType }): Promise<void> => {
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
 * Decorator that handles bookmark removal events
 * Simply calls methods for browser.bookmarks.onRemoved.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'id' and 'removeInfo' properties
 * unless parameter decorators are used.
 */
export function onBookmarkRemoved<T extends AllowedListener>({ filter }: { filter?: (arg: { id: string, removeInfo: browser.Bookmarks.OnRemovedRemoveInfoType }) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
