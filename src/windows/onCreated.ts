import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { window: browser.Windows.Window }) => unknown)

const listeners = new Set<(arg: { window: browser.Windows.Window }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.windows.onCreated.addListener((window) => {
    for (const listener of listeners)
      listener({ window })
  })
})

const windowDecoratorInfo = createDecorator<keyof browser.Windows.Window | void>('windowInfo')

export const windowInfo = windowDecoratorInfo.decorator

// map onCreated data to parameter decorators
function decoratorsHandler(arg: { window: browser.Windows.Window }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingWindowParameters: { index: number, key?: keyof browser.Windows.Window }[] = Reflect.getOwnMetadata(windowDecoratorInfo.key, constructor, propertyKey) || []

  if (existingWindowParameters.length) {
    const customArg = []
    for (const { index, key } of existingWindowParameters) {
      customArg[index] = key ? arg.window[key] : arg.window
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol, options: { filter?: (arg: { window: browser.Windows.Window }) => boolean | Promise<boolean> } = {}) {
  return async (arg: { window: browser.Windows.Window }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(arg))) {
      return
    }

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
 * Decorator that handles window creation events
 * Simply calls methods for browser.windows.onCreated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a browser window is created.
 * The method is called with a 'window' parameter by default unless parameter decorators are used.
 */
export function onWindowCreated<T extends AllowedListener>({ filter }: { filter?: (arg: { window: browser.Windows.Window }) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
