import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { id: string }) => unknown)

const listeners = new Set<(arg: { id: string }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.management.onUninstalled.addListener((info: string | { id: string }) => {
    const id: string = typeof info === 'string' ? info : info.id
    for (const listener of listeners)
      listener({ id })
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<{ id: string }, AllowedListener>('extensionId')

export const extensionId = decorator

/**
 * @overview
 *
 * Decorator that handles extension uninstallation events
 * Simply calls methods for browser.management.onUninstalled.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an extension is uninstalled.
 * The method is called with an 'id' parameter containing the extension id by default
 * unless parameter decorators are used.
 */
export function onExtensionUninstalled<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
