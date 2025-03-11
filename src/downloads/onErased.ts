import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { downloadId: number }) => unknown)

const listeners = new Set<(arg: { downloadId: number }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.downloads.onErased.addListener((downloadId) => {
    for (const listener of listeners)
      listener({ downloadId })
  })
})

const downloadIdDecoratorInfo = createDecorator<void>('downloadId')

export const downloadId = downloadIdDecoratorInfo.decorator

// map onErased data to parameter decorators
function decoratorsHandler(arg: { downloadId: number }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDownloadIdParameters: { index: number }[] = Reflect.getOwnMetadata(downloadIdDecoratorInfo.key, constructor, propertyKey) || []

  if (existingDownloadIdParameters.length) {
    const customArg = []
    for (const { index } of existingDownloadIdParameters) {
      customArg[index] = arg.downloadId
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { downloadId: number }): Promise<void> => {
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
 * Decorator that handles download erased events
 * Simply calls methods for browser.downloads.onErased.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a download is erased from history.
 * The method is called with a 'downloadId' parameter by default unless parameter decorators are used.
 */
export function onDownloadErased<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
