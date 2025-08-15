import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'

import { callOnce } from '~/utils'

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
const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType, AllowedListener>('onReferenceFragmentUpdatedDetails')

export const referenceFragmentUpdatedDetails = decorator

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
export function onReferenceFragmentUpdated<T extends AllowedListener>({ filter }: { filter?: (details: browser.WebNavigation.OnReferenceFragmentUpdatedDetailsType) => boolean | Promise<boolean> } = {}) {
  createInitialListener()

  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
