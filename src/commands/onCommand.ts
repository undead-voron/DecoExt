import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = (() => unknown) | ((command: string) => unknown)

const listeners = new Set<(arg: { command: string }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.commands.onCommand.addListener((command) => {
    for (const listener of listeners)
      listener({ command })
  })
})

function listenerWrapper(constructor: any, method: AllowedListener, _propertyKey: string | symbol) {
  return async (arg: { command: string }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, arg.command)
  }
}

/**
 * @overview
 *
 * Decorator that handles keyboard command events
 * Simply calls methods for browser.commands.onCommand.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a command is executed using a keyboard shortcut.
 * The method is called with a 'command' parameter by default unless parameter decorators are used.
 * The command parameter is the name of the command that was executed.
 */
export function onCommand<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
