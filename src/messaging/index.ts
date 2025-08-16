import { JsonValue } from 'type-fest'
import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'

import { resolve } from '../instanceResolver'
import { handler as parametersDecoratorHandler } from './paramaterDecoratorsHandler'
import { DataTypeKey, GetDataType, GetReturnType } from './types'

export { decorator as messageData } from './messageDataParamaterDecorator'
export { decorator as messageSender } from './messageSenderParamaterDecorator'
export type { ProtocolMap, ProtocolWithReturn } from './types'

interface DefaultArg { data: any, sender: browser.Runtime.MessageSender }

type TypedAllowedListener<T extends DataTypeKey> = (...args: any[]) => GetReturnType<T>
  | (() => GetReturnType<T>)
  | ((arg: { sender: browser.Runtime.MessageSender }) => GetReturnType<T>)
  | ((arg: { data: any }) => GetReturnType<T>)
  | ((arg: DefaultArg) => GetReturnType<T>)

const listeners = new Map<DataTypeKey, TypedAllowedListener<DataTypeKey>>()

function listenerWrapper<T extends DataTypeKey>(targetClass: any, method: TypedAllowedListener<T>, propertyKey: string | symbol, options: { filter?: (arg: { data: GetDataType<T>, sender: browser.Runtime.MessageSender }) => boolean | Promise<boolean> } = {}) {
  return async (arg: DefaultArg): Promise<ReturnType<TypedAllowedListener<T>> | undefined> => {
    const instanceWrapperConstructor = container.get(targetClass.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(arg))) {
      return
    }

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    return method.call(instance, ...parametersDecoratorHandler(arg, targetClass, propertyKey))
  }
}

const createInitialListener = callOnce(() => {
  browser.runtime.onMessage.addListener(async (details: unknown, sender: browser.Runtime.MessageSender) => {
    const name: string | undefined = (details as { name?: string })?.name
    if (name) {
      const listener = listeners.get(name as DataTypeKey)
      if (listener) {
        return listener({ data: (details as { data?: any })?.data, sender })
      }
    }
  })
})

/**
 * @description
 *
 * Add listener for message by name
 */
export function onMessage<K extends DataTypeKey, T extends (...args: any[]) => GetReturnType<K>>({ key, filter }: { key: K, filter?: (arg: { data: GetDataType<K>, sender: browser.Runtime.MessageSender }) => boolean | Promise<boolean> }) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    const eventKey = key
    if (!eventKey || typeof eventKey === 'symbol') {
      throw new Error('method key must be a string or a custom key must be provided')
    }

    // TODO: throw error if listener already exists
    listeners.set(eventKey, listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}

/**
 * @description
 *
 * Send message from background to content. Must be called from background only
 */
export function sendMessageToContent<K extends DataTypeKey = DataTypeKey>(name: K, data: GetDataType<K, JsonValue>, target: { tabId: number }): Promise<GetReturnType<K>> {
  return browser.tabs.sendMessage(target.tabId, { data, name })
}

/**
 * @description
 * Send message to background from content, popup, etc.
 */
export function sendMessageToBackground<K extends DataTypeKey = DataTypeKey>(name: K, data: GetDataType<K, JsonValue>): Promise<GetReturnType<K>> {
  return browser.runtime.sendMessage({ name, data })
}

/**
 * @description
 * Custom listener that will be called for event with provided name
 */
export function addMessageListener<K extends DataTypeKey = DataTypeKey>(name: K, callback: (arg: { data: GetDataType<K>, sender: browser.Runtime.MessageSender }) => GetReturnType<K> | Promise<GetReturnType<K>>) {
  createInitialListener()
  listeners.set(name, callback)
}

export function removeMessageListener<K extends DataTypeKey = DataTypeKey>(name: K) {
  listeners.delete(name)
}
