import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

// Use any for the download delta type to avoid type issues
type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { downloadDelta: any }) => unknown)

const listeners = new Set<(arg: { downloadDelta: any }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.downloads.onChanged.addListener((downloadDelta) => {
    for (const listener of listeners)
      listener({ downloadDelta })
  })
})

const downloadDeltaDecoratorInfo = createDecorator<string | void>('downloadDelta')

export const downloadDelta = downloadDeltaDecoratorInfo.decorator

// map onChanged data to parameter decorators
function decoratorsHandler(arg: { downloadDelta: any }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDownloadDeltaParameters: { index: number, key?: string }[] = Reflect.getOwnMetadata(downloadDeltaDecoratorInfo.key, constructor, propertyKey) || []

  if (existingDownloadDeltaParameters.length) {
    const customArg = []
    for (const { index, key } of existingDownloadDeltaParameters) {
      customArg[index] = key ? arg.downloadDelta[key] : arg.downloadDelta
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { downloadDelta: any }): Promise<void> => {
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
 * Decorator that handles download changed events
 * Simply calls methods for browser.downloads.onChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a download is updated.
 * The method is called with a 'downloadDelta' parameter by default unless parameter decorators are used.
 * The downloadDelta object contains the download id and optional changes to the download's properties.
 */
export function onDownloadChanged<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
