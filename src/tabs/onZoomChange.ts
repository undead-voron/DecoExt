import browser from 'webextension-polyfill'

import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'

interface ZoomChangeInfo {
  tabId: number
  oldZoomFactor: number
  newZoomFactor: number
  zoomSettings: browser.Tabs.ZoomSettings
}

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((zoomChangeInfo: ZoomChangeInfo) => unknown)

const listeners = new Set<(zoomChangeInfo: ZoomChangeInfo) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    for (const listener of listeners)
      listener(zoomChangeInfo)
  })
})

const { listenerWrapper, decorator } = buildDecoratorAndMethodWrapper<ZoomChangeInfo, AllowedListener>('zoomChangeInfo')

export const zoomChangeInfo = decorator

/**
 * @overview
 *
 * Decorator that handles tab zoom change events
 * Simply calls methods for browser.tabs.onZoomChange.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a tab's zoom factor changes.
 * The method is called with a 'zoomChangeInfo' parameter by default unless parameter decorators are used.
 */
export function onTabZoomChange<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
