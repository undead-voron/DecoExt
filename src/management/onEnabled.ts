import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { info: browser.Management.ExtensionInfo }) => unknown)

const listeners = new Set<(arg: { info: browser.Management.ExtensionInfo }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.management.onEnabled.addListener((info) => {
    for (const listener of listeners)
      listener({ info })
  })
})

const extensionInfoDecoratorInfo = createDecorator<keyof browser.Management.ExtensionInfo | void>('enabledExtensionInfo')

export const enabledExtensionInfo = extensionInfoDecoratorInfo.decorator

// map onEnabled data to parameter decorators
function decoratorsHandler(arg: { info: browser.Management.ExtensionInfo }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingInfoParameters: { index: number, key?: keyof browser.Management.ExtensionInfo }[] = Reflect.getOwnMetadata(extensionInfoDecoratorInfo.key, constructor, propertyKey) || []

  if (existingInfoParameters.length) {
    const customArg = []
    for (const { index, key } of existingInfoParameters) {
      customArg[index] = key ? arg.info[key] : arg.info
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { info: browser.Management.ExtensionInfo }): Promise<void> => {
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
 * Decorator that handles extension enabled events
 * Simply calls methods for browser.management.onEnabled.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an extension is enabled.
 * The method is called with an 'info' parameter containing details about the extension by default
 * unless parameter decorators are used.
 */
export function onExtensionEnabled<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
