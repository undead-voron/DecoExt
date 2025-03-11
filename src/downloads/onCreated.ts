import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { downloadItem: browser.Downloads.DownloadItem }) => unknown)

const listeners = new Set<(arg: { downloadItem: browser.Downloads.DownloadItem }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.downloads.onCreated.addListener((downloadItem) => {
    for (const listener of listeners)
      listener({ downloadItem })
  })
})

const downloadItemDecoratorInfo = createDecorator<keyof browser.Downloads.DownloadItem | void>('downloadItem')

export const downloadItem = downloadItemDecoratorInfo.decorator

// map onCreated data to parameter decorators
function decoratorsHandler(arg: { downloadItem: browser.Downloads.DownloadItem }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDownloadItemParameters: { index: number, key?: keyof browser.Downloads.DownloadItem }[] = Reflect.getOwnMetadata(downloadItemDecoratorInfo.key, constructor, propertyKey) || []

  if (existingDownloadItemParameters.length) {
    const customArg = []
    for (const { index, key } of existingDownloadItemParameters) {
      customArg[index] = key ? arg.downloadItem[key] : arg.downloadItem
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { downloadItem: browser.Downloads.DownloadItem }): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(arg, constructor, propertyKey))
  }
}

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
