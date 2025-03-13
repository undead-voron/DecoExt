import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { details: browser.WebNavigation.OnDOMContentLoadedDetailsType }) => unknown)

const listeners = new Set<(arg: { details: browser.WebNavigation.OnDOMContentLoadedDetailsType }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onDOMContentLoaded.addListener((details) => {
    for (const listener of listeners)
      listener({ details })
  })
})

const detailsDecoratorInfo = createDecorator<keyof browser.WebNavigation.OnDOMContentLoadedDetailsType | void>('domContentLoadedDetails')

export const domContentLoadedDetails = detailsDecoratorInfo.decorator

// map onDOMContentLoaded data to parameter decorators
function decoratorsHandler(arg: { details: browser.WebNavigation.OnDOMContentLoadedDetailsType }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDetailsParameters: { index: number, key?: keyof browser.WebNavigation.OnDOMContentLoadedDetailsType }[] = Reflect.getOwnMetadata(detailsDecoratorInfo.key, constructor, propertyKey) || []

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
  return async (arg: { details: browser.WebNavigation.OnDOMContentLoadedDetailsType }): Promise<void> => {
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
 * Decorator that handles webNavigation DOM content loaded events
 * Simply calls methods for browser.webNavigation.onDOMContentLoaded.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'details' property
 * unless parameter decorators are used.
 */
export function onDOMContentLoaded<T extends AllowedListener>() {
  // TODO: add filtering
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
