import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((downloadItem: browser.Downloads.DownloadItem) => unknown)

const listeners = new Set<(downloadItem: browser.Downloads.DownloadItem) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.downloads.onCreated.addListener((downloadItem) => {
    for (const listener of listeners)
      listener(downloadItem)
  })
})

const { decorator, listenerWrapper } = buildDecoratorAndMethodWrapper<browser.Downloads.DownloadItem, AllowedListener>('downloadItem')

export const downloadItem = decorator

/**
 * @overview
 *
 * Decorator that handles download created events
 * Simply calls methods for browser.downloads.onCreated.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a download begins.
 * The method is called with a 'downloadItem' parameter by default unless parameter decorators are used.
 */
export function onDownloadCreated<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
