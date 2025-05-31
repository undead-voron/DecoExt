import browser from 'webextension-polyfill'

import { createDecorator } from '~/buildDecoratorAndMethodWrapper'
import { callOnce } from '~/utils'
import container from '../injectablesContainer'
import { resolve } from '../instanceResolver'

export type StorageDomain = 'local' | 'sync' | 'session'

export interface StorageChangeData {
  changes: Record<string, browser.Storage.StorageChange>
  areaName: StorageDomain
}

export interface StorageChangeOptions {
  domain?: StorageDomain
  key?: string
}

type AllowedListener = ((...args: any[]) => any) | (() => unknown) | ((data: StorageChangeData) => unknown)

const listeners = new Map<string, Set<(data: StorageChangeData) => Promise<void>>>()
const globalListeners = new Set<(data: StorageChangeData) => Promise<void>>()

const createInitialListener = callOnce(() => {
  browser.storage.onChanged.addListener((changes, areaName) => {
    const data: StorageChangeData = { changes, areaName: areaName as StorageDomain }

    // Call global listeners (no domain/key filtering)
    for (const listener of globalListeners) {
      listener(data)
    }

    // Call domain-specific listeners
    const domainKey = `domain:${areaName}`
    const domainListeners = listeners.get(domainKey)
    if (domainListeners) {
      for (const listener of domainListeners) {
        listener(data)
      }
    }

    // Call key-specific listeners
    for (const [changeKey] of Object.entries(changes)) {
      const keyListeners = listeners.get(`key:${changeKey}`)
      if (keyListeners) {
        for (const listener of keyListeners) {
          listener(data)
        }
      }

      // Call domain+key specific listeners
      const domainKeyListeners = listeners.get(`domain:${areaName}:key:${changeKey}`)
      if (domainKeyListeners) {
        for (const listener of domainKeyListeners) {
          listener(data)
        }
      }
    }
  })
})

// Parameter decorators for data mapping
const changesDecoratorInfo = createDecorator<keyof Record<string, browser.Storage.StorageChange> | void>('storageChanges')
const areaNameDecoratorInfo = createDecorator<void>('storageAreaName')
const changeValueDecoratorInfo = createDecorator<'oldValue' | 'newValue' | void>('storageChangeValue')

export const storageChanges = changesDecoratorInfo.decorator
export const storageAreaName = areaNameDecoratorInfo.decorator
export const storageChangeValue = changeValueDecoratorInfo.decorator

// Map storage change data to parameter decorators
function decoratorsHandler(
  data: StorageChangeData,
  constructor: any,
  propertyKey: string | symbol,
  options: StorageChangeOptions = {},
): Array<any> {
  const existingChangesParameters: { index: number, key?: keyof typeof data.changes }[]
    = Reflect.getOwnMetadata(changesDecoratorInfo.key, constructor, propertyKey) || []
  const existingAreaNameParameters: { index: number, key?: void }[]
    = Reflect.getOwnMetadata(areaNameDecoratorInfo.key, constructor, propertyKey) || []
  const existingChangeValueParameters: { index: number, key?: 'oldValue' | 'newValue' }[]
    = Reflect.getOwnMetadata(changeValueDecoratorInfo.key, constructor, propertyKey) || []

  if (existingChangesParameters.length || existingAreaNameParameters.length || existingChangeValueParameters.length) {
    const customArgs: any[] = []

    // Handle changes parameters
    for (const { index, key } of existingChangesParameters) {
      customArgs[index] = key ? data.changes[key] : data.changes
    }

    // Handle area name parameters
    for (const { index } of existingAreaNameParameters) {
      customArgs[index] = data.areaName
    }

    // Handle change value parameters (for specific key)
    for (const { index, key } of existingChangeValueParameters) {
      if (options.key && data.changes[options.key]) {
        const change = data.changes[options.key]
        customArgs[index] = key ? change[key] : change
      }
      else {
        // If no specific key, return the first change found
        const firstChangeKey = Object.keys(data.changes)[0]
        if (firstChangeKey) {
          const change = data.changes[firstChangeKey]
          customArgs[index] = key ? change[key] : change
        }
      }
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
  options: StorageChangeOptions = {},
) {
  return async (data: StorageChangeData): Promise<void> => {
    // Filter by domain if specified
    if (options.domain && data.areaName !== options.domain) {
      return
    }

    // Filter by key if specified
    if (options.key && !data.changes[options.key]) {
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
 * Decorator that handles browser storage change events
 * Simply calls methods for browser.storage.onChanged.addListener
 * This decorator only allowed on classes that were decorated by 'InjectableService' decorator
 *
 * @description
 * Method is called when storage data changes in any storage area (local, sync, session).
 * The method is called with a data parameter containing 'changes' and 'areaName' properties
 * unless parameter decorators are used.
 *
 * @param options Configuration options for filtering storage changes
 * @param options.domain - Filter by storage domain ('local', 'sync', 'session')
 * @param options.key - Filter by specific storage key
 *
 * @example
 * ```typescript
 * @onStorageChanged({ domain: 'local', key: 'settings' })
 * handleSettingsChange(
 *   @storageChangeValue('newValue') newSettings: any,
 *   @storageAreaName areaName: string
 * ) {
 *   console.log('Settings changed:', newSettings, 'in', areaName)
 * }
 * ```
 */
export function onStorageChanged<T extends AllowedListener>(
  options: StorageChangeOptions = {},
) {
  createInitialListener()

  return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): void => {
    const listener = listenerWrapper(target, descriptor.value as T, propertyKey, options)

    // Determine which listener set to add to based on options
    if (!options.domain && !options.key) {
      // Global listener - no filtering
      globalListeners.add(listener)
    }
    else if (options.domain && options.key) {
      // Domain + key specific listener
      const key = `domain:${options.domain}:key:${options.key}`
      if (!listeners.has(key)) {
        listeners.set(key, new Set())
      }
      listeners.get(key)!.add(listener)
    }
    else if (options.domain) {
      // Domain specific listener
      const key = `domain:${options.domain}`
      if (!listeners.has(key)) {
        listeners.set(key, new Set())
      }
      listeners.get(key)!.add(listener)
    }
    else if (options.key) {
      // Key specific listener
      const key = `key:${options.key}`
      if (!listeners.has(key)) {
        listeners.set(key, new Set())
      }
      listeners.get(key)!.add(listener)
    }
  }
}
