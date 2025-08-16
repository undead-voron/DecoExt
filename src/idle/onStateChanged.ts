import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = (() => unknown) | ((newState: browser.Idle.IdleState) => unknown)

const listeners = new Set<(newState: browser.Idle.IdleState) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.idle.onStateChanged.addListener((newState) => {
    for (const listener of listeners)
      listener(newState)
  })
})

function listenerWrapper(constructor: any, method: AllowedListener, _propertyKey: string | symbol, options: { filter?: (newState: browser.Idle.IdleState) => boolean | Promise<boolean> } = {}) {
  return async (newState: browser.Idle.IdleState): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(newState))) {
      return
    }

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, newState)
  }
}

/**
 * @overview
 *
 * Decorator that handles idle state changed events
 * Simply calls methods for browser.idle.onStateChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the system changes to an active, idle or locked state.
 * The method is called with a 'newState' parameter by default unless parameter decorators are used.
 */
export function onIdleStateChanged<T extends AllowedListener>({ filter }: { filter?: (newState: browser.Idle.IdleState) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
