import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown)

const listeners = new Set<() => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.runtime.onSuspend.addListener(() => {
    for (const listener of listeners)
      listener()
  })
})

function listenerWrapper(constructor: any, method: AllowedListener, _propertyKey: string | symbol, options: { filter?: () => boolean | Promise<boolean> } = {}) {
  return async (): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter())) {
      return
    }

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
 * Decorator that handles extension suspend events
 * Simply calls methods for browser.runtime.onSuspend.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called just before the extension is about to be suspended (usually when the browser is shutting down).
 * Use this to do cleanup operations like closing IndexedDB connections.
 * No parameters are passed to the method.
 */
export function onExtensionSuspend<T extends AllowedListener>({ filter }: { filter?: () => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
