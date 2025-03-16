import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown)

const listeners = new Set<() => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.runtime.onSuspendCanceled.addListener(() => {
    for (const listener of listeners)
      listener()
  })
})

function listenerWrapper(constructor: any, method: AllowedListener, _propertyKey: string | symbol) {
  return async (): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance)
  }
}

/**
 * @overview
 *
 * Decorator that handles extension suspend cancellation events
 * Simply calls methods for browser.runtime.onSuspendCanceled.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the extension suspend has been canceled.
 * This typically happens when the browser startup is aborted.
 * No parameters are passed to the method.
 */
export function onSuspendCanceled<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
