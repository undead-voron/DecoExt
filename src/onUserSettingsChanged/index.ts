import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

interface UserSettingsChangeInfo {
  isOnToolbar: boolean
}

type AllowedListener = (...args: any[]) => any
  | (() => any)
  | ((changeInfo: UserSettingsChangeInfo) => unknown)

const listeners = new Set<(changeInfo: UserSettingsChangeInfo) => Promise<void>>()

const createInitialListener = callOnce(() => {
  const browserAction = browser.browserAction ?? browser.action
  if (browserAction?.onUserSettingsChanged) {
    // @ts-expect-error some incorrect typing in webextension-polyfill
    browserAction.onUserSettingsChanged.addListener((changeInfo: UserSettingsChangeInfo) => {
      for (const listener of listeners)
        listener(changeInfo)
    })
  }
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<UserSettingsChangeInfo, AllowedListener>('userSettingsChangedDetails')

export const userSettingsChangedDetails = decorator

/**
 * @overview
 *
 * Decorator that handles browser action user settings changed event
 * Simply calls methods for browser.browserAction.onUserSettingsChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called with parameter that represents the user settings change info.
 * The changeInfo object contains:
 * - isOnToolbar (boolean): Indicates whether the extension's browser action icon is visible on the top-level toolbar
 */
export function onUserSettingsChanged<T extends AllowedListener>({ filter }: { filter?: (changeInfo: UserSettingsChangeInfo) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
