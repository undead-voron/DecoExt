import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import { createDecorator } from './buildDecoratorAndMethodWrapper'
import container from './injectablesContainer'
import { resolve } from './instanceResolver'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { info: browser.Menus.OnClickData, tab?: browser.Tabs.Tab }) => unknown)

const listeners = new Set<(details: { info: browser.Menus.OnClickData, tab?: browser.Tabs.Tab }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.contextMenus.onClicked.addListener((info: browser.Menus.OnClickData, tab?: browser.Tabs.Tab) => {
    for (const listener of listeners)
      listener({ info, tab })
  })
})

const detailsDecoratorInfo = createDecorator<keyof browser.Menus.OnClickData | void>('menusClickedInfo')
const tabDecoratorInfo = createDecorator<keyof browser.Tabs.Tab | void>('menusClickedTabs')

export const menusClickedDetails = detailsDecoratorInfo.decorator
export const menusClickedTab = tabDecoratorInfo.decorator

function decoratorsHandler(arg: { tab?: browser.Tabs.Tab, info: browser.Menus.OnClickData }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingDetailsParameters: { index: number, key?: keyof typeof arg.info }[] = Reflect.getOwnMetadata(detailsDecoratorInfo.key, constructor, propertyKey) || []
  const existingTabParameters: { index: number, key?: keyof browser.Tabs.Tab }[] = Reflect.getOwnMetadata(tabDecoratorInfo.key, constructor, propertyKey) || []
  if (existingDetailsParameters.length || existingTabParameters.length) {
    const customArg = []
    for (const { index, key } of existingDetailsParameters) {
      customArg[index] = key ? arg.info[key] : arg.info
    }
    for (const { index, key } of existingTabParameters) {
      customArg[index] = key ? arg.tab?.[key] : arg.tab
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { info: browser.Menus.OnClickData, tab?: browser.Tabs.Tab }): Promise<void> => {
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
 * @description
 * Trigger when item from context menu is clicked
 */
export function onMenusClicked<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
