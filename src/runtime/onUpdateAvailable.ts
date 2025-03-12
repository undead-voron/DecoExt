import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

interface UpdateInfo {
  version: string
}

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { details: UpdateInfo }) => unknown)

const listeners = new Set<(arg: { details: UpdateInfo }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.runtime.onUpdateAvailable.addListener((details) => {
    for (const listener of listeners)
      listener({ details })
  })
})

const updateDetailsDecoratorInfo = createDecorator<keyof UpdateInfo | void>('updateDetails')

export const updateDetails = updateDetailsDecoratorInfo.decorator

// map onUpdateAvailable data to parameter decorators
function decoratorsHandler(arg: { details: UpdateInfo }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDetailsParameters: { index: number, key?: keyof UpdateInfo }[] = Reflect.getOwnMetadata(updateDetailsDecoratorInfo.key, constructor, propertyKey) || []

  if (existingDetailsParameters.length) {
    const customArg = []
    for (const { index, key } of existingDetailsParameters) {
      customArg[index] = key ? arg.details[key] : arg.details
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { details: UpdateInfo }): Promise<void> => {
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
 * Decorator that handles extension update availability events
 * Simply calls methods for browser.runtime.onUpdateAvailable.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an update to the extension is available
 * The method is called with a 'details' parameter by default unless parameter decorators are used.
 * The details object contains the version of the available update.
 * If you want the update to be applied immediately, you must call browser.runtime.reload().
 */
export function onUpdateAvailable<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
