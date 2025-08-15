import browser from 'webextension-polyfill'

import { resolve } from '~/instanceResolver'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'

type AllowedListener = () => unknown

const listeners = new Set<() => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.omnibox.onInputStarted.addListener(() => {
    for (const listener of listeners) {
      listener()
    }
  })
})

function listenerWrapper(targetClass: any, method: AllowedListener, _propertyKey: string | symbol, options: { filter?: () => boolean | Promise<boolean> } = {}) {
  return async (): Promise<void> => {
  // get class wrapper from classes container
    const instanceWrapperConstructor = container.get(targetClass.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter())) {
      return
    }

    // resolve class to get single instance of classp
    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
    // await instance initialization
      await instance.init()
    }
    // call method only after class instance is resolved and all dependencies were resolved and initialized
    method.call(instance)
  }
}
/**
 * @overview
 *
 * Decorator that handles omnibox input started events
 * Simply calls methods for browser.omnibox.onInputStarted.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the user begins typing in the omnibox and the extension's
 * keyword is selected. No parameters are passed to the method.
 */
export function onOmniboxInputStarted<T extends AllowedListener>({ filter }: { filter?: () => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
