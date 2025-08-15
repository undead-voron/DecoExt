import browser from 'webextension-polyfill'

import container from '~/injectablesContainer'
import { resolve } from '~/instanceResolver'
import { callOnce } from '~/utils'

type AllowedListener = (text?: string) => unknown

const listeners = new Set<(text?: string) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.omnibox.onDeleteSuggestion.addListener((text: string) => {
    for (const listener of listeners) {
      listener(text)
    }
  })
})

function listenerWrapper(targetClass: any, method: AllowedListener, _propertyKey: string | symbol, options: { filter?: (text?: string) => boolean | Promise<boolean> } = {}) {
  return async (text?: string): Promise<void> => {
  // get class wrapper from classes container
    const instanceWrapperConstructor = container.get(targetClass.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(text))) {
      return
    }

    // resolve class to get single instance of classp
    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
    // await instance initialization
      await instance.init()
    }
    // call method only after class instance is resolved and all dependencies were resolved and initialized
    method.call(instance, text)
  }
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
export function onOmniboxDeleteSuggestion<T extends AllowedListener>({ filter }: { filter?: (text?: string) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
