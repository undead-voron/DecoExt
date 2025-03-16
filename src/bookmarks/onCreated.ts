import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }) => unknown)

const listeners = new Set<(arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.bookmarks.onCreated.addListener((id, bookmark) => {
    for (const listener of listeners)
      listener({ id, bookmark })
  })
})

const bookmarkIdDecoratorInfo = createDecorator<'id' | void>('bookmarkId')
const bookmarkNodeDecoratorInfo = createDecorator<keyof browser.Bookmarks.BookmarkTreeNode | void>('bookmarkNode')

export const bookmarkId = bookmarkIdDecoratorInfo.decorator
export const bookmarkNode = bookmarkNodeDecoratorInfo.decorator

// map onCreated data to parameter decorators
function decoratorsHandler(arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingIdParameters: { index: number, key?: 'id' }[] = Reflect.getOwnMetadata(bookmarkIdDecoratorInfo.key, constructor, propertyKey) || []
  const existingNodeParameters: { index: number, key?: keyof browser.Bookmarks.BookmarkTreeNode }[] = Reflect.getOwnMetadata(bookmarkNodeDecoratorInfo.key, constructor, propertyKey) || []

  if (existingIdParameters.length || existingNodeParameters.length) {
    const customArg = []
    for (const { index, key } of existingIdParameters) {
      customArg[index] = key ? arg[key] : arg.id
    }
    for (const { index, key } of existingNodeParameters) {
      customArg[index] = key ? arg.bookmark[key] : arg.bookmark
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { id: string, bookmark: browser.Bookmarks.BookmarkTreeNode }): Promise<void> => {
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
 * Decorator that handles bookmark creation events
 * Simply calls methods for browser.bookmarks.onCreated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'id' and 'bookmark' properties
 * unless parameter decorators are used.
 */
export function onBookmarkCreated<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
