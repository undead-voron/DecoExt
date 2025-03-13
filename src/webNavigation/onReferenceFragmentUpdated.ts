import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { resolve } from '~/instanceResolver'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'

type AllowedListener =
  ((...args: any[]) => any) |
  (() => unknown) |
  ((details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType) => unknown)

const listeners = new Set<(details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
    for (const listener of listeners) {
      listener(details)
    }
  })
})
const detailsInfoDecorator = createDecorator<keyof browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType | void>('onReferenceFragmentUpdatedDetails')

function decoratorsHandler(arg: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDetailsParameters: { index: number, key?: keyof browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType }[] = Reflect.getOwnMetadata(detailsInfoDecorator.key, constructor, propertyKey) || []

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
export const referenceFragmentUpdatedDetails = detailsInfoDecorator.decorator

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType): Promise<void> => {
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
 * Decorator that handles web navigation reference fragment updated events
 * Simply calls methods for browser.webNavigation.onReferenceFragmentUpdated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the reference fragment of a frame was updated. This happens when
 * the fragment identifier of a URL changes (the part after the '#'). The method is called
 * with a 'details' parameter by default unless parameter decorators are used.
 *
 * The 'details' parameter contains information about the navigation, including:
 * - tabId: The ID of the tab in which the navigation occurred
 * - url: The URL to which the page navigated
 * - frameId: The ID of the frame in which the navigation occurred
 * - timeStamp: The time when the navigation occurred, in milliseconds since the epoch
 * - transitionType: The type of transition, e.g. "link", "typed", etc.
 * - transitionQualifiers: An array of qualifiers describing the transition
 */
export function onReferenceFragmentUpdated<T extends AllowedListener>() {
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    createInitialListener()
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}

