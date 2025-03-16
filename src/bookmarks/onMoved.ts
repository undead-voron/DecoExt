import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { id: string, moveInfo: browser.Bookmarks.OnMovedMoveInfoType }) => unknown)

const listeners = new Set<(arg: { id: string, moveInfo: browser.Bookmarks.OnMovedMoveInfoType }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.bookmarks.onMoved.addListener((id, moveInfo) => {
    for (const listener of listeners)
      listener({ id, moveInfo })
  })
})

const bookmarkIdDecoratorInfo = createDecorator<'id' | void>('bookmarkMovedId')
const moveInfoDecoratorInfo = createDecorator<keyof browser.Bookmarks.OnMovedMoveInfoType | void>('bookmarkMoveInfo')

export const bookmarkMovedId = bookmarkIdDecoratorInfo.decorator
export const bookmarkMoveInfo = moveInfoDecoratorInfo.decorator

// map onMoved data to parameter decorators
function decoratorsHandler(arg: { id: string, moveInfo: browser.Bookmarks.OnMovedMoveInfoType }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingIdParameters: { index: number, key?: 'id' }[] = Reflect.getOwnMetadata(bookmarkIdDecoratorInfo.key, constructor, propertyKey) || []
  const existingMoveInfoParameters: { index: number, key?: keyof browser.Bookmarks.OnMovedMoveInfoType }[] = Reflect.getOwnMetadata(moveInfoDecoratorInfo.key, constructor, propertyKey) || []

  if (existingIdParameters.length || existingMoveInfoParameters.length) {
    const customArg = []
    for (const { index, key } of existingIdParameters) {
      customArg[index] = key ? arg[key] : arg.id
    }
    for (const { index, key } of existingMoveInfoParameters) {
      customArg[index] = key ? arg.moveInfo[key] : arg.moveInfo
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { id: string, moveInfo: browser.Bookmarks.OnMovedMoveInfoType }): Promise<void> => {
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
 * Decorator that handles bookmark move events
 * Simply calls methods for browser.bookmarks.onMoved.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'id' and 'moveInfo' properties
 * unless parameter decorators are used.
 */
export function onBookmarkMoved<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
