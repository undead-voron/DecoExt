import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { command: string }) => unknown)

const listeners = new Set<(arg: { command: string }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.commands.onCommand.addListener((command) => {
    for (const listener of listeners)
      listener({ command })
  })
})

const commandNameDecoratorInfo = createDecorator<'command' | void>('commandName')

export const commandName = commandNameDecoratorInfo.decorator

// map onCommand data to parameter decorators
function decoratorsHandler(arg: { command: string }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingCommandParameters: { index: number, key?: 'command' }[] = Reflect.getOwnMetadata(commandNameDecoratorInfo.key, constructor, propertyKey) || []

  if (existingCommandParameters.length) {
    const customArg = []
    for (const { index, key } of existingCommandParameters) {
      customArg[index] = key ? arg[key] : arg.command
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { command: string }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(arg, constructor, propertyKey))
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
