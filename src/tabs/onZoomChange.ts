import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

interface ZoomChangeInfo {
  tabId: number
  oldZoomFactor: number
  newZoomFactor: number
  zoomSettings: browser.Tabs.ZoomSettings
}

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { zoomChangeInfo: ZoomChangeInfo }) => unknown)

const listeners = new Set<(arg: { zoomChangeInfo: ZoomChangeInfo }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    for (const listener of listeners)
      listener({ zoomChangeInfo })
  })
})

const zoomChangeInfoDecoratorInfo = createDecorator<keyof ZoomChangeInfo | void>('zoomChangeInfo')

export const zoomChangeInfo = zoomChangeInfoDecoratorInfo.decorator

// map onZoomChange data to parameter decorators
function decoratorsHandler(arg: { zoomChangeInfo: ZoomChangeInfo }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingZoomParameters: { index: number, key?: keyof ZoomChangeInfo }[] = Reflect.getOwnMetadata(zoomChangeInfoDecoratorInfo.key, constructor, propertyKey) || []

  if (existingZoomParameters.length) {
    const customArg = []
    for (const { index, key } of existingZoomParameters) {
      customArg[index] = key ? arg.zoomChangeInfo[key] : arg.zoomChangeInfo
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { zoomChangeInfo: ZoomChangeInfo }): Promise<void> => {
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
