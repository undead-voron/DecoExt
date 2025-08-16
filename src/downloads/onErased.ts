import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = (() => unknown) | ((downloadId: number) => unknown)

const listeners = new Set<(downloadId: number) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.downloads.onErased.addListener((downloadId) => {
    for (const listener of listeners)
      listener(downloadId)
  })
})

function listenerWrapper(constructor: any, method: AllowedListener, _propertyKey: string | symbol, options: { filter?: (downloadId: number) => boolean | Promise<boolean> } = {}) {
  return async (downloadId: number): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(downloadId))) {
      return
    }

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, downloadId)
  }
}

/**
 * @overview
 *
 * Decorator that handles download erased events
 * Simply calls methods for browser.downloads.onErased.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a download is erased from history.
 * The method is called with a 'downloadId' parameter by default.
 */
export function onDownloadErased<T extends AllowedListener>({ filter }: { filter?: (downloadId: number) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
