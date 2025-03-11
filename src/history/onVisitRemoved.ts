import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

// Define the removed visit info type based on the browser API documentation
interface RemovedVisits {
  allHistory: boolean
  urls?: string[]
}

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { removed: RemovedVisits }) => unknown)

const listeners = new Set<(arg: { removed: RemovedVisits }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.history.onVisitRemoved.addListener((removed) => {
    for (const listener of listeners)
      listener({ removed })
  })
})

const removedInfoDecoratorInfo = createDecorator<keyof RemovedVisits | void>('removedInfo')

export const removedInfo = removedInfoDecoratorInfo.decorator

// map onVisitRemoved data to parameter decorators
function decoratorsHandler(arg: { removed: RemovedVisits }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingRemovedInfoParameters: { index: number, key?: keyof RemovedVisits }[] = Reflect.getOwnMetadata(removedInfoDecoratorInfo.key, constructor, propertyKey) || []

  if (existingRemovedInfoParameters.length) {
    const customArg = []
    for (const { index, key } of existingRemovedInfoParameters) {
      customArg[index] = key ? arg.removed[key] : arg.removed
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { removed: RemovedVisits }): Promise<void> => {
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
 * Decorator that handles history visit removal events
 * Simply calls methods for browser.history.onVisitRemoved.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'removed' property with the interface matching RemovedVisits type
 * unless parameter decorators are used.
 */
export function onHistoryVisitRemoved<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
