import browser from 'webextension-polyfill';
import { buildDecoratorAndMethodWrapper } from '~/buildDecoratorAndMethodWrapper';
import { callOnce } from '~/utils';

// Type definitions
export type AllowedListener = 
  | ((changes: { [key: string]: browser.storage.StorageChange }, areaName: browser.storage.AreaName) => any)
  | ((...args: any[]) => any);

export interface StorageOptions {
  storageArea: browser.storage.AreaName;
  key?: string;
}

// Global Listener Management
type WrappedFunction = (...args: any[]) => any; // Placeholder, will be refined by buildDecoratorAndMethodWrapper
const listeners = new Map<browser.storage.AreaName, Map<string | symbol, Set<WrappedFunction>>>();
const DEFAULT_KEY = Symbol('defaultKey');

const initialListener = callOnce(() => {
  browser.storage.onChanged.addListener((changes, areaName) => {
    const areaListeners = listeners.get(areaName);
    if (!areaListeners) {
      return;
    }

    // Trigger listeners for specific keys
    for (const key in changes) {
      const keyListeners = areaListeners.get(key);
      if (keyListeners) {
        for (const listener of keyListeners) {
          // Parameters for the listener will be handled by createDecoratorHandler
          // For now, we pass the raw event data.
          // The actual arguments will depend on parameter decorators.
          listener(changes, areaName, changes[key]); 
        }
      }
    }

    // Trigger listeners for the default key (all changes in the area)
    const defaultKeyListeners = areaListeners.get(DEFAULT_KEY);
    if (defaultKeyListeners) {
      for (const listener of defaultKeyListeners) {
        // Parameters for the listener will be handled by createDecoratorHandler
        listener(changes, areaName);
      }
    }
  });
});

// Decorator Implementation
export function onStorageChanged<T extends AllowedListener>({ storageArea, key }: StorageOptions) {
  initialListener(); // Ensure the browser listener is active

  // Define ParametersForListener based on potential arguments to the wrapped method
  // This will be used by createDecoratorHandler
  type ParametersForListener = {
    allChanges: { [key: string]: browser.storage.StorageChange };
    areaName: browser.storage.AreaName;
    specificChange?: browser.storage.StorageChange; // For specific key listening
  };

  const { decorator, listenerWrapper, key: metadataKey } = buildDecoratorAndMethodWrapper<ParametersForListener, T>(
    'storageChange' // metadataKey for parameter decorators
  );
export const storageMetadataKey = metadataKey;

  return decorator((target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value as T;
    if (typeof originalMethod !== 'function') {
      throw new Error(`@onStorageChanged can only be applied to methods, not ${typeof originalMethod}`);
    }

    const wrappedListener = listenerWrapper(target, originalMethod, propertyKey, (changes, areaName, specificChange) => {
      // This function constructs the payload for the decoratedParametersHandler
      return {
        allChanges: changes,
        areaName: areaName,
        specificChange: key ? changes[key] : undefined,
      };
    });

    // Store the listener
    let areaListeners = listeners.get(storageArea);
    if (!areaListeners) {
      areaListeners = new Map<string | symbol, Set<WrappedFunction>>();
      listeners.set(storageArea, areaListeners);
    }

    const listenKey = key || DEFAULT_KEY;
    let keyListeners = areaListeners.get(listenKey);
    if (!keyListeners) {
      keyListeners = new Set<WrappedFunction>();
      areaListeners.set(listenKey, keyListeners);
    }

    keyListeners.add(wrappedListener);

    // Return the original descriptor, as the method itself isn't changed directly,
    // but rather its execution is triggered by the listener.
    return descriptor;
  });
}
