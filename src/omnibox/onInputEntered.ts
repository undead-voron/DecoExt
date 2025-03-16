import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type DispositionType = browser.Omnibox.OnInputEnteredDisposition

interface InternalArg { text: string, disposition: DispositionType }

type AllowedListener =
  ((...args: any[]) => any) |
  (() => unknown) |
  ((arg: InternalArg) => unknown)

const listeners = new Set<(args: InternalArg) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.omnibox.onInputEntered.addListener((text, disposition) => {
    for (const listener of listeners) {
      listener({ text, disposition })
    }
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<InternalArg, AllowedListener>('onOmniboxInputEntered')

export const omniboxInputEntered = decorator
/**
 * @overview
 *
 * Decorator that handles omnibox input entered events
 * Simply calls methods for browser.omnibox.onInputEntered.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the user accepts the input in the omnibox with the extension's
 * keyword selected. The method is called with 'text' and 'disposition' parameters by default
 * unless parameter decorators are used.
 *
 * The 'text' parameter is the user's input that was accepted
 * The 'disposition' parameter indicates how the user accepted the input:
 * - 'currentTab': Open in the current tab
 * - 'newForegroundTab': Open in a new foreground tab
 * - 'newBackgroundTab': Open in a new background tab
 */
export function onOmniboxInputEntered<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
