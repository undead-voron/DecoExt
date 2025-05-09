import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((details: browser.Runtime.OnInstalledDetailsType) => unknown)

const listeners = new Set<(details: browser.Runtime.OnInstalledDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.runtime.onInstalled.addListener((details: browser.Runtime.OnInstalledDetailsType) => {
    for (const listener of listeners)
      listener(details)
  })
})

export const { decorator, key } = createDecorator<keyof browser.Runtime.OnInstalledDetailsType | void>('onInstalledDetails')
export const installedDetails = decorator

// map onAdded data to parameter decorators
function decoratorsHandler(details: browser.Runtime.OnInstalledDetailsType, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingPermissionsParameters: { index: number, key?: keyof browser.Runtime.OnInstalledDetailsType }[] = Reflect.getOwnMetadata(key, constructor, propertyKey) || []

  if (existingPermissionsParameters.length) {
    const customArg = []
    for (const { index, key } of existingPermissionsParameters) {
      customArg[index] = key ? details[key] : details
    }
    return customArg
  }
  else {
    return [details]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol, arg: Partial<Pick<browser.Runtime.OnInstalledDetailsType, 'reason' | 'temporary'>> = {}) {
  return async (details: browser.Runtime.OnInstalledDetailsType): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const isReasonValid = !arg.reason || arg.reason === details.reason
    const checkTemporal = !arg.temporary || (arg.temporary && details.temporary)
    if (isReasonValid && checkTemporal) {
      const instance = resolve(instanceWrapperConstructor)
      if (instance.init && typeof instance.init === 'function') {
        // await instance initialization
        await instance.init()
      }
      method.call(instance, ...decoratorsHandler(details, constructor, propertyKey))
    }
  }
}

/**
 * @overview
 *
 * Decorator that handles onInstall event
 * Simply calls methods for browser.runtime.onInstalled.addListener
 * This decorator anly allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'details' property with the interface matching browser.Runtime.OnInstalledDetailsType type.
 */
export function onInstalled<T extends AllowedListener>(
  arg: Partial<Pick<browser.Runtime.OnInstalledDetailsType, 'reason' | 'temporary'>> = {},
) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, arg))
  }
}
