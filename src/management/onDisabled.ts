import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((info: browser.Management.ExtensionInfo) => unknown)

const listeners = new Set<(info: browser.Management.ExtensionInfo) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.management.onDisabled.addListener((info) => {
    for (const listener of listeners)
      listener(info)
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<browser.Management.ExtensionInfo, AllowedListener>('disabledExtensionInfo')

export const disabledExtensionInfo = decorator
/**
 * @overview
 *
 * Decorator that handles extension disabled events
 * Simply calls methods for browser.management.onDisabled.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an extension is disabled.
 * The method is called with an 'info' parameter containing details about the extension by default
 * unless parameter decorators are used.
 */
export function onExtensionDisabled<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
