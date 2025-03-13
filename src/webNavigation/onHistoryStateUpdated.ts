import browser from 'webextension-polyfill'
import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener =
  ((...args: any[]) => any) |
  (() => unknown) |
  ((details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType) => unknown)

const listeners = new Set<(details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    for (const listener of listeners) {
      listener(details)
    }
  })
})

const detailsInfoDecorator = createDecorator<keyof browser.WebNavigation.OnHistoryStateUpdatedDetailsType | void>('onHistoryStateUpdatedDetails')

function decoratorsHandler(arg: browser.WebNavigation.OnHistoryStateUpdatedDetailsType, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDetailsParameters: { index: number, key?: keyof browser.WebNavigation.OnHistoryStateUpdatedDetailsType }[] = Reflect.getOwnMetadata(detailsInfoDecorator.key, constructor, propertyKey) || []

  if (existingDetailsParameters.length) {
    const customArg = []
    for (const { index, key } of existingDetailsParameters) {
      customArg[index] = key ? arg[key] : arg
    }
    return customArg
  }
  else {
    return [arg]
  }
}
export const historyStateUpdatedDetails = detailsInfoDecorator.decorator

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(details, constructor, propertyKey))
  }
}

/**
 * @overview
 *
 * Decorator that handles web navigation history state updated events
 * Simply calls methods for browser.webNavigation.onHistoryStateUpdated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the page's history state is updated, for example when the
 * pushState() or replaceState() methods are called. The method is called with a 'details'
 * parameter by default unless parameter decorators are used.
 *
 * The 'details' parameter contains information about the navigation, including:
 * - tabId: The ID of the tab in which the navigation occurred
 * - url: The URL to which the page navigated
 * - processId: The ID of the process that runs the renderer for this frame
 * - frameId: The ID of the frame in which the navigation occurred
 * - timeStamp: The time when the navigation occurred, in milliseconds since the epoch
 * - transitionType: The type of transition, e.g. "link", "typed", etc.
 * - transitionQualifiers: An array of qualifiers describing the transition
 */
export function onHistoryStateUpdated<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
