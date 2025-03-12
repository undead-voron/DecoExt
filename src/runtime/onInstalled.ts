import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = (() => unknown) | ((arg: { details: browser.Runtime.OnInstalledDetailsType }) => unknown)

const listeners = new Set<(details: browser.Runtime.OnInstalledDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.runtime.onInstalled.addListener((details: browser.Runtime.OnInstalledDetailsType) => {
    for (const listener of listeners)
      listener(details)
  })
})

function listenerWrapper(constructor: any, method: AllowedListener, arg: Partial<Pick<browser.Runtime.OnInstalledDetailsType, 'reason' | 'temporary'>> = {}) {
  return async (details: browser.Runtime.OnInstalledDetailsType): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const isReasonValid = !arg.reason || arg.reason === details.reason
    const checkTemporal = !arg.temporary || details.temporary
    if (isReasonValid && checkTemporal) {
      const instance = resolve(instanceWrapperConstructor)
      if (instance.init && typeof instance.init === 'function') {
        // await instance initialization
        await instance.init()
      }
      method.call(instance, { details })
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
  return (target: any, _propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target.constructor, descriptor.value as T, arg))
  }
}
