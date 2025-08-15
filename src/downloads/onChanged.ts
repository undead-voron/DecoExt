import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

// Use any for the download delta type to avoid type issues
type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((downloadDelta: browser.Downloads.OnChangedDownloadDeltaType) => unknown)

const listeners = new Set<(downloadDelta: browser.Downloads.OnChangedDownloadDeltaType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.downloads.onChanged.addListener((downloadDelta) => {
    for (const listener of listeners)
      listener(downloadDelta)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.Downloads.OnChangedDownloadDeltaType, AllowedListener>('downloadDelta')

export const downloadDelta = decorator

/**
 * @overview
 *
 * Decorator that handles download changed events
 * Simply calls methods for browser.downloads.onChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a download is updated.
 * The method is called with a 'downloadDelta' parameter by default unless parameter decorators are used.
 * The downloadDelta object contains the download id and optional changes to the download's properties.
 */
export function onDownloadChanged<T extends AllowedListener>({ filter }: { filter?: (downloadDelta: browser.Downloads.OnChangedDownloadDeltaType) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
