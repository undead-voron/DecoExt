import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((details: browser.Runtime.OnInstalledDetailsType) => unknown)

const listeners = new Set<(details: browser.Runtime.OnInstalledDetailsType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.runtime.onInstalled.addListener((details: browser.Runtime.OnInstalledDetailsType) => {
    for (const listener of listeners)
      listener(details)
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<browser.Runtime.OnInstalledDetailsType, AllowedListener>('onInstalledDetails')

export const installedDetails = decorator

/**
 * @overview
 *
 * Decorator that handles onInstall event
 * Simply calls methods for browser.runtime.onInstalled.addListener
 * This decorator anly allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that contains 'details' property with the interface matching browser.Runtime.OnInstalledDetailsType type.
 */
export function onInstalled<T extends AllowedListener>(
  _arg: Partial<Pick<browser.Runtime.OnInstalledDetailsType, 'reason' | 'temporary'>> = {},
) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
