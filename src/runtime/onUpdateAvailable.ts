import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

interface UpdateInfo {
  version: string
}

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((details: UpdateInfo) => unknown)

const listeners = new Set<(details: UpdateInfo) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.runtime.onUpdateAvailable.addListener((details) => {
    for (const listener of listeners)
      listener(details)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<UpdateInfo, AllowedListener>('updateDetails')

export const updateDetails = decorator

/**
 * @overview
 *
 * Decorator that handles extension update availability events
 * Simply calls methods for browser.runtime.onUpdateAvailable.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when an update to the extension is available
 * The method is called with a 'details' parameter by default unless parameter decorators are used.
 * The details object contains the version of the available update.
 * If you want the update to be applied immediately, you must call browser.runtime.reload().
 */
export function onUpdateAvailable<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
