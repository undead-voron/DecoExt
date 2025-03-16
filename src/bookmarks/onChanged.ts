import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { id: string, changeInfo: browser.Bookmarks.OnChangedChangeInfoType }) => unknown)

const listeners = new Set<(arg: { id: string, changeInfo: browser.Bookmarks.OnChangedChangeInfoType }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.bookmarks.onChanged.addListener((id, changeInfo) => {
    for (const listener of listeners)
      listener({ id, changeInfo })
  })
})

const bookmarkIdDecoratorInfo = createDecorator<'id' | void>('bookmarkChangedId')
const changeInfoDecoratorInfo = createDecorator<keyof browser.Bookmarks.OnChangedChangeInfoType | void>('bookmarkChangeInfo')

export const bookmarkChangedId = bookmarkIdDecoratorInfo.decorator
export const bookmarkChangeInfo = changeInfoDecoratorInfo.decorator

// map onChanged data to parameter decorators
function decoratorsHandler(arg: { id: string, changeInfo: browser.Bookmarks.OnChangedChangeInfoType }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingIdParameters: { index: number, key?: 'id' }[] = Reflect.getOwnMetadata(bookmarkIdDecoratorInfo.key, constructor, propertyKey) || []
  const existingChangeInfoParameters: { index: number, key?: keyof browser.Bookmarks.OnChangedChangeInfoType }[] = Reflect.getOwnMetadata(changeInfoDecoratorInfo.key, constructor, propertyKey) || []

  if (existingIdParameters.length || existingChangeInfoParameters.length) {
    const customArg = []
    for (const { index, key } of existingIdParameters) {
      customArg[index] = key ? arg[key] : arg.id
    }
    for (const { index, key } of existingChangeInfoParameters) {
      customArg[index] = key ? arg.changeInfo[key] : arg.changeInfo
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { id: string, changeInfo: browser.Bookmarks.OnChangedChangeInfoType }): Promise<void> => {
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
 * Decorator that handles bookmark change events
 * Simply calls methods for browser.bookmarks.onChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'id' and 'changeInfo' properties
 * unless parameter decorators are used.
 */
export function onBookmarkChanged<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
