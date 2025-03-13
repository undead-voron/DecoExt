import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '~/injectablesContainer'
import { resolve } from '~/instanceResolver'

type AllowedListener = () => unknown

const listeners = new Set<() => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.omnibox.onInputCancelled.addListener(() => {
    for (const listener of listeners) {
      listener()
    }
  })
})

const listenerWrapper = (targetClass: any, method: AllowedListener, _propertyKey: string | symbol) => async (): Promise<void> => {
  // get class wrapper from classes container
  const instanceWrapperConstructor = container.get(targetClass.constructor)
  if (!instanceWrapperConstructor)
    throw new Error('decorator should be applied on class decorated by "Service" decorator')

  // resolve class to get single instance of classp
  const instance = resolve(instanceWrapperConstructor)
  if (instance.init && typeof instance.init === 'function') {
    // await instance initialization
    await instance.init()
  }
  // call method only after class instance is resolved and all dependencies were resolved and initialized
  method.call(instance)
}

/**
 * @overview
 *
 * Decorator that handles omnibox input cancelled events
 * Simply calls methods for browser.omnibox.onInputCancelled.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the user cancels the input in the omnibox with the extension's
 * keyword selected. No parameters are passed to the method.
 */
export function onOmniboxInputCancelled<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
