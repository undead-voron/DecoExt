import browser from 'webextension-polyfill'

import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'
import { permissionsDetailsDecorator } from './propertyDecorator'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((permissions: browser.Permissions.Permissions) => unknown)

const listeners = new Set<(permissions: browser.Permissions.Permissions) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.permissions.onAdded.addListener((permissions) => {
    for (const listener of listeners)
      listener(permissions)
  })
})

// map onAdded data to parameter decorators
function decoratorsHandler(permissions: browser.Permissions.Permissions, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingPermissionsParameters: { index: number, key?: keyof browser.Permissions.Permissions }[] = Reflect.getOwnMetadata(permissionsDetailsDecorator.key, constructor, propertyKey) || []

  if (existingPermissionsParameters.length) {
    const customArg = []
    for (const { index, key } of existingPermissionsParameters) {
      customArg[index] = key ? permissions[key] : permissions
    }
    return customArg
  }
  else {
    return [permissions]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol, options: { filter?: (permissions: browser.Permissions.Permissions) => boolean | Promise<boolean> } = {}) {
  return async (permissions: browser.Permissions.Permissions): Promise<void> => {
    const instanceWrapperConstructor = container.get(constructor.constructor)
    if (!instanceWrapperConstructor)
      throw new Error('decorator should be applied on class decorated by "Service" decorator')

    if (options.filter && !(await options.filter(permissions))) {
      return
    }

    const instance = resolve(instanceWrapperConstructor)
    if (instance.init && typeof instance.init === 'function') {
      // await instance initialization
      await instance.init()
    }
    method.call(instance, ...decoratorsHandler(permissions, constructor, propertyKey))
  }
}

/**
 * @overview
 *
 * Decorator that handles permission added events
 * Simply calls methods for browser.permissions.onAdded.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the extension receives new permissions.
 * The method is called with a 'permissions' parameter by default unless parameter decorators are used.
 */
export function onPermissionsAdded<T extends AllowedListener>({ filter }: { filter?: (permissions: browser.Permissions.Permissions) => boolean | Promise<boolean> } = {}) {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey, { filter }))
  }
}
