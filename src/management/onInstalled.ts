import browser from 'webextension-polyfill'

import container from '~/injectablesContainer'
import { resolve } from '~/instanceResolver'
import { callOnce } from '~/utils'
import { key as extensionInfoKey } from './sharedParametersDecorator'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((info: browser.Management.ExtensionInfo) => unknown)

const listeners = new Set<(info: browser.Management.ExtensionInfo) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.management.onInstalled.addListener((info) => {
    for (const listener of listeners)
      listener(info)
  })
})

function decoratorsHandler(info: browser.Management.ExtensionInfo, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingParameterDecorators: { index: number, key?: keyof typeof info }[] = Reflect.getOwnMetadata(extensionInfoKey, constructor, propertyKey) || []
  if (existingParameterDecorators.length) {
    const customArg = []
    for (const { index, key } of existingParameterDecorators) {
      customArg[index] = key ? info[key] : info
    }
    return customArg
  }
  else {
    return [info]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (info: browser.Management.ExtensionInfo): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(info, constructor, propertyKey))
  }
}

/**
 * @overview
 *
 * Decorator that handles extension installation events
 * Simply calls methods for browser.management.onInstalled.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an extension is installed.
 * The method is called with an 'info' parameter containing details about the extension by default
 * unless parameter decorators are used.
 */
export function onExtensionInstalled<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
