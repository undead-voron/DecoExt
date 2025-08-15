import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

export interface CookieChangeOptions {
  name?: string
  path?: string
  domain?: string
}

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((data: browser.Cookies.OnChangedChangeInfoType) => unknown)

const globalListeners = new Set<(data: browser.Cookies.OnChangedChangeInfoType) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.cookies.onChanged.addListener((changeInfo) => {
    // Call global listeners (no filtering)
    for (const listener of globalListeners) {
      listener(changeInfo)
    }
  })
})

// Parameter decorators for data mapping
const cookieDecoratorInfo = createDecorator<keyof browser.Cookies.OnChangedChangeInfoType['cookie'] | void>('cookie')
const cookieCauseDecoratorInfo = createDecorator<void>('cookieCause')
const cookieRemovedDecoratorInfo = createDecorator<void>('cookieRemoved')

export const cookie = cookieDecoratorInfo.decorator
export const cookieCause = cookieCauseDecoratorInfo.decorator
export const cookieRemoved = cookieRemovedDecoratorInfo.decorator

// Map cookie change data to parameter decorators
function decoratorsHandler(
  data: browser.Cookies.OnChangedChangeInfoType,
  constructor: any,
  propertyKey: string | symbol,
  _options: CookieChangeOptions = {},
): Array<any> {
  const existingCookieParameters: { index: number, key?: string & keyof browser.Cookies.OnChangedChangeInfoType['cookie'] }[]
    = Reflect.getOwnMetadata(cookieDecoratorInfo.key, constructor, propertyKey) || []
  const existingCauseParameters: { index: number }[]
    = Reflect.getOwnMetadata(cookieCauseDecoratorInfo.key, constructor, propertyKey) || []
  const existingRemovedParameters: { index: number }[]
    = Reflect.getOwnMetadata(cookieRemovedDecoratorInfo.key, constructor, propertyKey) || []
  if (
    existingCookieParameters.length
    || existingCauseParameters.length
    || existingRemovedParameters.length
  ) {
    const customArgs: any[] = []

    // Handle cookie parameters
    for (const { index, key } of existingCookieParameters) {
      customArgs[index] = key ? data.cookie[key] : data.cookie
    }

    // Handle cause parameters
    for (const { index } of existingCauseParameters) {
      customArgs[index] = data.cause
    }

    // Handle removed parameters
    for (const { index } of existingRemovedParameters) {
      customArgs[index] = data.removed
    }

    return customArgs
  }
  else {
    return [data]
  }
}

function listenerWrapper(
  constructor: any,
  method: AllowedListener,
  propertyKey: string | symbol,
  options: CookieChangeOptions = {},
) {
  return async (data: browser.Cookies.OnChangedChangeInfoType): Promise<void> => {
    // Filter by options if specified
    if (
      (options.name && data.cookie.name !== options.name)
      || (Object.hasOwn(data.cookie, 'path') && data.cookie.path !== options.path)
      || (options.domain && data.cookie.domain !== options.domain)
    ) {
      return
    }

    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor) {
      throw new Error('decorator should be applied on class decorated by "Service" decorator')
    }

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }

    method.call(instance, ...decoratorsHandler(data, constructor, propertyKey, options))
  }
}

/**
 * @overview
 *
 * Decorator that handles browser cookie change events
 * Simply calls methods for browser.cookies.onChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when a cookie is set, removed, or expires.
 * The method is called with a data parameter containing 'cookie', 'removed', and 'cause' properties
 * unless parameter decorators are used.
 *
 * @param options Configuration options for filtering cookie changes
 * @param options.name - Filter by specific cookie name
 * @param options.path - Filter by specific cookie path
 * @param options.domain - Filter by specific cookie domain
 *
 * @example
 * ```typescript
 * @onCookieChanged({ name: 'sessionId', domain: '.example.com' })
 * handleSessionCookie(
 *   @cookieValue value: string,
 *   @cookieRemoved removed: boolean,
 *   @cookieCause cause: CookieChangeCause
 * ) {
 *   if (removed) {
 *     console.log('Session cookie removed:', cause)
 *   } else {
 *     console.log('Session cookie updated:', value)
 *   }
 * }
 * ```
 */
export function onCookieChanged<T extends AllowedListener>(
  options: CookieChangeOptions = {},
) {
  createInitialListener()

  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    const listener = listenerWrapper(target, descriptor.value as T, propertyKey, options)

    globalListeners.add(listener)
  }
}
