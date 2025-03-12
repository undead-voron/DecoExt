import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((windowId: number, ...args: any[]) => any) | (() => unknown)

const listeners = new Set<(windowId: number) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.windows.onFocusChanged.addListener((windowId) => {
    for (const listener of listeners)
      listener(windowId)
  })
})

function listenerWrapper(constructor: any, method: AllowedListener, _propertyKey: string | symbol) {
  return async (windowId: number): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, windowId)
  }
}

/**
 * @overview
 *
 * Decorator that handles window focus change events
 * Simply calls methods for browser.windows.onFocusChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the focus changes between windows.
 * The method is called with a 'windowId' parameter of type number
 * Note: windowId can be WINDOW_ID_NONE (-1) when all windows lose focus.
 */
export function onWindowFocusChanged<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
