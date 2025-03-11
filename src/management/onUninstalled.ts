import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { id: string }) => unknown)

const listeners = new Set<(arg: { id: string }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.management.onUninstalled.addListener((info: string | browser.Management.ExtensionInfo) => {
    const id: string = typeof info === 'string' ? info : info.id
    for (const listener of listeners)
      listener({ id })
  })
})

const extensionIdDecoratorInfo = createDecorator<void>('extensionId')

export const extensionId = extensionIdDecoratorInfo.decorator

// map onUninstalled data to parameter decorators
function decoratorsHandler(arg: { id: string }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingIdParameters: { index: number }[] = Reflect.getOwnMetadata(extensionIdDecoratorInfo.key, constructor, propertyKey) || []

  if (existingIdParameters.length) {
    const customArg = []
    for (const { index } of existingIdParameters) {
      customArg[index] = arg.id
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { id: string }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor) {
      throw new Error('decorator should be applied on class decorated by "Service" decorator')
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
 * Decorator that handles extension uninstallation events
 * Simply calls methods for browser.management.onUninstalled.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an extension is uninstalled.
 * The method is called with an 'id' parameter containing the extension id by default
 * unless parameter decorators are used.
 */
export function onExtensionUninstalled<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
