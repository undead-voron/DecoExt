import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type SuggestResult = browser.Omnibox.SuggestResult
type SuggestCallback = (suggestResults: SuggestResult[]) => void

interface InternalArgument { text: string, suggest: SuggestCallback }

type AllowedListener =
  ((...args: any[]) => any) |
  (() => unknown) |
  ((arg: Partial<InternalArgument>) => unknown)

const listeners = new Set<(arg: { text: string, suggest: SuggestCallback }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.omnibox.onInputChanged.addListener((text, suggest) => {
    for (const listener of listeners) {
      listener({ text, suggest })
    }
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<InternalArgument, AllowedListener>('omniboxInputChangedInfo')

export const omniboxInputChangedDetails = decorator

/**
 * @overview
 *
 * Decorator that handles omnibox input changed events
 * Simply calls methods for browser.omnibox.onInputChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the user changes the input in the omnibox with the extension's
 * keyword selected. The method is called with object that contains keys 'text' and 'suggest' by default
 * unless parameter decorators are used.
 *
 * The 'text' property is the user's input
 * The 'suggest' property is a callback that provides suggestions to the user
 */
export function onOmniboxInputChanged<T extends AllowedListener>({ filter }: { filter?: (arg: { text: string, suggest: SuggestCallback }) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
