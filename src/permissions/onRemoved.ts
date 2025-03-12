import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'
import { permissionsDetailsDecorator } from './propertyDecorator'

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((arg: { permissions: browser.Permissions.Permissions }) => unknown)

const listeners = new Set<(arg: { permissions: browser.Permissions.Permissions }) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.permissions.onRemoved.addListener((permissions) => {
    for (const listener of listeners)
      listener({ permissions })
  })
})

// map onRemoved data to parameter decorators
function decoratorsHandler(arg: { permissions: browser.Permissions.Permissions }, constructor: any, propertyKey: string | symbol): Array<any> {
  const existingPermissionsParameters: { index: number, key?: keyof browser.Permissions.Permissions }[] = Reflect.getOwnMetadata(permissionsDetailsDecorator.key, constructor, propertyKey) || []

  if (existingPermissionsParameters.length) {
    const customArg = []
    for (const { index, key } of existingPermissionsParameters) {
      customArg[index] = key ? arg.permissions[key] : arg.permissions
    }
    return customArg
  }
  else {
    return [arg]
  }
}

function listenerWrapper(constructor: any, method: AllowedListener, propertyKey: string | symbol) {
  return async (arg: { permissions: browser.Permissions.Permissions }): Promise<void> => {
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
 * Decorator that handles permission removed events
 * Simply calls methods for browser.permissions.onRemoved.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when the extension loses permissions.
 * The method is called with a 'permissions' parameter by default unless parameter decorators are used.
 */
export function onPermissionsRemoved<T extends AllowedListener>() {
  createInitialListener()
  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    listeners.add(listenerWrapper(target, descriptor.value as T, propertyKey))
  }
}
